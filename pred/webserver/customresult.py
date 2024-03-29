"""
Stores custom prediction/preference records.
Part of the tables used for custom jobs.
"""
import uuid
import math
from pred.queries.dbutil import update_database, read_database
from pred.webserver.errors import ClientException, ErrorType
from pred.queries.predictionqueryparts import begin_count, end_count
from pred.webserver.dnasequence import DNALookup

SEQUENCE_NOT_FOUND = "Unable to find sequence for this name."


class CustomResultData(object):
    def __init__(self, db, result_uuid, job_id, model_name, bed_data):
        """
        Setup custom result for saving to database.
        :param db: database connection
        :param result_uuid: str: uuid key for this result
        :param job_id: str: uuid of job associated with this result
        :param model_name: str: name of the model associated with this result
        :param bed_data: str: bed format data to be inserted into the database
        """
        self.db = db
        self.result_uuid = result_uuid
        self.job_id = job_id
        self.model_name = model_name
        self.bed_data = bed_data

    def save(self):
        """
        Save data to the database as a record per row from the bed file.
        """
        cur = self.db.cursor()
        self.save_main_record(cur)
        for line in self.bed_data.split("\n"):
            parts = line.split()
            if parts:
                chrom = parts[0]
                start = parts[1]
                end = parts[2]
                value = parts[3]
                self.save_bed_row(cur, chrom, start, end, value)
        cur.close()
        self.db.commit()

    def save_main_record(self, cur):
        """
        Save the custom_result parent record so save_bed_row can save to custom_result_row.
        :param cur: database cursor
        """
        insert_sql = "insert into custom_result(id, job_id, model_name) values (%s, %s, %s)"
        params = [self.result_uuid, self.job_id, self.model_name]
        cur.execute(insert_sql, params)

    def save_bed_row(self, cur, chrom, start, end, value):
        """
        Insert a single row of bed data into the database.
        :param cur: database cursor
        :param chrom: str: chromosome value(name)
        :param start: str: start location of the value
        :param end: str: end location of the value
        :param value: str: value across start-end
        """
        insert_sql = """insert into custom_result_row(result_id, name, start, stop, value)
              values(%s, %s, %s, %s, %s) """
        params = [self.result_uuid, chrom, start, end, value]
        cur.execute(insert_sql, params)

    @staticmethod
    def new_uuid():
        return str(uuid.uuid1())

    @staticmethod
    def get_prediction_query_and_params(result_uuid, sort_max_value, limit, offset):
        """
        Get query and params for predictions of a result with specified properties.
        :param result_uuid: str: uuid of the custom_result to search.
        :param sort_max_value:  boolean: true if we should sort by max prediction else sort by seq idx.
        :param limit: int: how many predictions to return
        :param offset: int: offset into results to allow paging
        :return: str,[str]: query and parameters
        """
        params = [result_uuid]
        select_sql = """select
            sequence_list_item.name as name,
            case WHEN max(value) > abs(min(value)) THEN
              round(max(value), 4)
            ELSE
              round(min(value), 4)
            end as max_value,
            json_agg(json_build_object('value', round(value, 4), 'start', start, 'end', stop)) as pred,
            max(sequence_list_item.sequence) as sequence_value
            from custom_result
            inner join job on custom_result.job_id = job.id
            left outer join sequence_list_item
              on sequence_list_item.seq_id = job.seq_id
            left outer join custom_result_row
              on custom_result_row.name = sequence_list_item.name
              and custom_result.id = custom_result_row.result_id
            where custom_result.id = %s
            group by sequence_list_item.name """
        if sort_max_value:
            select_sql += " order by max(abs(custom_result_row.value)) DESC "
        else:
            select_sql += " order by max(sequence_list_item.idx) "
        if limit:
            select_sql += " limit %s "
            params.append(limit)
        if offset:
            select_sql += " offset %s "
            params.append(offset)
        return select_sql, params

    @staticmethod
    def get_predictions(db, result_uuid, sort_max_value, limit, offset):
        """
        Get predictions of a result with specified properties.
        :param db: Database Connection
        :param result_uuid: str: uuid of the custom_result to search.
        :param sort_max_value:  boolean: true if we should sort by max prediction else sort by seq idx.
        :param limit: int: how many predictions to return
        :param offset: int: offset into results to allow paging
        :return: [dict]: list of prediction properties
        """
        result = []
        query, params = CustomResultData.get_prediction_query_and_params(result_uuid, sort_max_value,
                                                                         limit, offset)
        for row in read_database(db, query, params):
            name, max_value, pred, sequence = row
            if not sequence:
                sequence = SEQUENCE_NOT_FOUND
            if CustomResultData.is_none_prediction_values(pred):
                pred = []
            result.append({
                'name': name,
                'max': str(max_value),
                'values': pred,
                'sequence': sequence
            })
        return result

    @staticmethod
    def determine_last_page(db, result_uuid, per_page):
        """
        Determine what the last page in for the specified result_uuid given per_page
        :param db: database connection
        :param result_uuid: str: uuid of the custom result to query
        :param per_page: int: how many items are there per page
        :return: int: which page is the last
        """
        query, params = CustomResultData.last_page_query_and_params(result_uuid)
        rows = read_database(db, query, params)
        first_row = rows[0]
        items = float(first_row[0])
        return int(math.ceil(items / per_page))

    @staticmethod
    def last_page_query_and_params(result_uuid):
        """
        Create a query for finding the number of items in result_uuid
        :param result_uuid: str: uuid of the custom result to query
        :return: (query, params): query to count items and params it requires
        """
        query, params = CustomResultData.get_prediction_query_and_params(result_uuid,
                                                                         sort_max_value=None,
                                                                         limit=None,
                                                                         offset=None)
        max_query = begin_count()
        max_query.add(query, params)
        max_query.add_part(end_count())
        return max_query.sql, max_query.params

    @staticmethod
    def is_none_prediction_values(pred):
        if len(pred) == 1:
            return pred[0]['value'] == None
        return False

    @staticmethod
    def find_one(db, sequence_id, model_name):
        """
        Find a single custom result for the specified sequence and model
        :param db: Database Connection
        :param sequence_id: str: uuid of the custom sequence to search for
        :param model_name: str: name of the model to search for
        :return: int value of custom_result or None if not found
        """
        select_sql = "select custom_result.id from custom_result " \
                     " inner join job on job.id = job_id " \
                     " where seq_id = %s and custom_result.model_name = %s"
        for row in read_database(db, select_sql, [sequence_id, model_name]):
            return row[0]
        return None

    @staticmethod
    def find(db, sequence_id, model_name):
        """
        Find custom results with the sequence_id and optionally model_name.
        :param db: Database Connection
        :param sequence_id: str: uuid of the custom sequence to search for
        :param model_name: str: name of the model to search for, None if for all model names
        :return: [dict]: array of custom result info
        """
        try:
            val = uuid.UUID(sequence_id, version=4)
        except ValueError:
            raise ClientException(message="Sequence id is not a valid uuid", error_type=ErrorType.INVALID_SEQUENCE_ID)
        select_sql = "select custom_result.id, custom_result.model_name from custom_result " \
                     " inner join job on job.id = job_id " \
                     " where seq_id = %s"
        params = [sequence_id]
        if model_name:
            select_sql += " and custom_result.model_name = %s"
            params.append(model_name)
        result = []
        for row in read_database(db, select_sql, params):
            values = {
                'resultId': row[0],
                'modelName': row[1],
                'sequenceId': sequence_id,
            }
            result.append(values)
        return result

    @staticmethod
    def bed_file_contents(db, result_id):
        """
        Returns bed file contents given a custom result id.
        Bed file is just tsv with columns name, start, stop, value, dna sequence
        :param db: Database Connection
        :param result_id: uuid of the result we want to lookup
        :return: str: bed file contents
        """
        sequence_lookup = CustomResultData.custom_result_sequence_lookup(db, result_id)
        select_sql = "select name, start, stop, value from custom_result_row " \
                     " where result_id = %s"
        result = ""
        for row in read_database(db, select_sql, [result_id]):
            name, start, stop, value = row
            full_dna_sequence = sequence_lookup.get(name)
            dna_sequence = full_dna_sequence[start:stop]
            line = '\t'.join([name, str(start), str(stop), str(value), dna_sequence])
            result += line + '\n'
        return result

    @staticmethod
    def custom_result_sequence_lookup(db, result_id):
        """
        Returns name to DNA Sequence dictionary based on the sequence used in a custom result
        :param db: Database Connection
        :param result_id: uuid of the result we want to lookup
        :return: dict: name -> DNA sequence(str)
        """
        select_sql = "select sequence_list_item.name, sequence_list_item.sequence " \
                     "from custom_result " \
                     "inner join job on job.id = job_id " \
                     "inner join sequence_list_item on sequence_list_item.seq_id = job.seq_id " \
                     "where custom_result.id = %s;"
        name_to_dna_seq = {}
        for row in read_database(db, select_sql, [result_id]):
            name, sequence = row
            name_to_dna_seq[name] = sequence
        return name_to_dna_seq

    @staticmethod
    def delete_for_job(cur, job_id):
        cur.execute("delete from custom_result_row where job_id = %s", [job_id])
        cur.execute("delete from custom_result where job_id = %s", [job_id])
