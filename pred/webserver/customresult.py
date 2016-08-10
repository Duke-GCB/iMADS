"""
Stores custom prediction/preference records.
Part of the tables used for custom jobs.
"""
import uuid
from pred.queries.dbutil import update_database, read_database

SEQUENCE_NOT_FOUND = "Unable to find sequence for this name."


class CustomResultData(object):
    def __init__(self, db, result_uuid, job_id, model_name, bed_data):
        self.db = db
        self.result_uuid = result_uuid
        self.job_id = job_id
        self.model_name = model_name
        self.bed_data = bed_data

    def save(self):
        for line in self.bed_data.split("\n"):
            parts = line.split("\t")
            chrom = parts[0]
            start = parts[1]
            end = parts[2]
            value = parts[3]
            self.save_bed_row(chrom, start, end, value)

    def save_bed_row(self, chrom, start, end, value):
        insert_sql = """insert into custom_result(id, job_id, model_name, name, start, stop, value)
              values(%s, %s, %s, %s, %s, %s, %s) """
        params = [self.result_uuid, self.job_id, self.model_name, chrom, start, end, value]
        update_database(self.db, insert_sql, params)

    @staticmethod
    def new_uuid():
        return str(uuid.uuid1())

    @staticmethod
    def get_prediction_query_and_params(result_uuid, sort_max_value, limit, offset):
        params = [result_uuid]
        select_sql = """select
            custom_result.name as name,
            round(max(value),4) as max_value,
            json_agg(json_build_object('value', round(value, 4), 'start', start, 'end', stop)),
            max(sequence_list_item.sequence)
            as pred
            from custom_result
            inner join job on job.id = custom_result.job_id
            left outer join sequence_list_item on sequence_list_item.seq_id = job.seq_id
                and custom_result.name = sequence_list_item.name
            where custom_result.id = %s
            group by custom_result.name """
        if sort_max_value:
            select_sql += " order by max(custom_result.value) DESC "
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
        result = []
        query, params = CustomResultData.get_prediction_query_and_params(result_uuid, sort_max_value,
                                                                         limit, offset)
        for row in read_database(db, query, params):
            name, max_value, pred, sequence = row
            if not sequence:
                sequence = SEQUENCE_NOT_FOUND
            result.append({
                'name': name,
                'max': max_value,
                'values': pred,
                'sequence': sequence
            })
        return result

    @staticmethod
    def find_one(db, sequence_id, model_name):
        select_sql = "select distinct custom_result.id from custom_result " \
                     " inner join job on job.id = job_id " \
                     " where seq_id = %s and custom_result.model_name = %s"
        for row in read_database(db, select_sql, [sequence_id, model_name]):
            return row[0]
        return None

    @staticmethod
    def bed_file_contents(db, result_id):
        select_sql = "select name, start, stop, value from custom_result " \
                     " where id = %s"
        result = ""
        for row in read_database(db, select_sql, [result_id]):
            name, start, stop, value = row
            line = '\t'.join([name, str(start), str(stop), str(value)])
            result += line + '\n'
        return result
