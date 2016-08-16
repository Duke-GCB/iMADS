import math
import uuid
import base64
import psycopg2.extras
from pred.webserver.customlist import CustomList, does_custom_list_exist, get_gene_name_set
from pred.queries.predictionquery import PredictionQuery
from pred.queries.maxpredictionquery import MaxPredictionQuery
from pred.queries.genelistquery import GeneListQuery, GeneListUnusedNames
from pred.queries.rangelistquery import RangeListQuery

CUSTOM_GENE_LIST = 'Custom Gene List'
CUSTOM_RANGES_LIST = 'Custom Ranges List'

CUSTOM_GENE_NAME_TYPE = 'gene_name'
CUSTOM_ID_TYPE = 'id'


def get_predictions_with_guess(db, config, genome, args):
    search_args = SearchArgs(config.binding_max_offset, args)
    if search_args.is_last_page():
        last_page = determine_last_page(db, genome, search_args)
        search_args.set_page(last_page)
    model = search_args.get_model_name()
    max_sort_guess = config.get_max_sort_guess(genome, model)
    search = PredictionSearch(db, genome, search_args, enable_guess=True, max_sort_guess=max_sort_guess)
    predictions = search.get_predictions()
    if search.has_max_prediction_guess():  # repeat without guess if we didn't get enough values
        per_page = search.get_per_page()
        if per_page:
            if len(predictions) < per_page:
                search.enable_guess = False
                predictions = search.get_predictions()
    return predictions, search.args, search.warning


def determine_last_page(db, genome, search_args):
    search = PredictionSearch(db, genome, search_args, enable_guess=True)
    items = float(search.get_count())
    per_page = int(search_args.get_per_page())
    return int(math.ceil(items / per_page))


def get_all_values(prediction, size):
    if not size:
        size = int(prediction['end']) - int(prediction['start'])
    values = [0] * size
    offset = 0
    if 'start' in prediction:
        offset = int(prediction['start'])
    for data in prediction['values']:
        start = int(data['start'])
        value = data['value']
        idx = start - offset
        if 0 <= idx <= size:
            if value > values[idx]:
                values[idx] = value
    result = [str(val) for val in values]
    if 'strand' in prediction:
        if prediction['strand'] == '-':
            return result[::-1]
    return result


class PredictionQueryNames(object):
    COMMON_NAME = 'common_name'
    NAME = 'name'
    MAX_VALUE = 'max_value'
    CHROM = 'chrom'
    STRAND = 'strand'
    GENE_BEGIN = 'gene_begin'
    PRED = 'pred'
    RANGE_START = 'range_start'
    RANGE_END = 'range_end'


class SearchArgs(object):
    GENE_LIST = 'geneList'
    MODEL = 'protein'
    UPSTREAM = 'upstream'
    DOWNSTREAM = 'downstream'
    PAGE = 'page'
    PER_PAGE = 'perPage'
    MAX_PREDICTION_SORT = 'maxPredictionSort'
    FORMAT = 'format'
    INCLUDE_ALL = 'includeAll'
    CUSTOM_LIST_DATA = 'customListData'
    CUSTOM_LIST_FILTER = 'customListFilter'
    CUSTOM_GENE_SEARCH_TYPE ='customGeneSearchType'

    def __init__(self, max_stream_val, args):
        self.max_stream_val = max_stream_val
        self.args = args
        self.page = args.get(self.PAGE)

    def _get_required_arg(self, name):
        value = self.args.get(name, None)
        if not value:
            raise ValueError("Missing {} field.".format(name))
        return value

    def _get_required_stream_arg(self, name):
        value = self._get_required_arg(name)
        int_value = int(value)
        if int_value < 1:
            raise ValueError("{} value must be positive.".format(name))
        if int_value > self.max_stream_val:
            raise ValueError("{} value must be less than {}.".format(name, self.max_stream_val))
        if not value:
            raise ValueError("Missing {} field.".format(name))
        return int_value

    def get_gene_list(self):
        return self._get_required_arg(self.GENE_LIST)

    def get_model_name(self):
        return self._get_required_arg(self.MODEL)

    def get_upstream(self):
        return self._get_required_stream_arg(self.UPSTREAM)

    def get_downstream(self):
        return self._get_required_stream_arg(self.DOWNSTREAM)

    def get_sort_by_max(self):
        return "true" == self.args.get(self.MAX_PREDICTION_SORT)

    def get_page_and_per_page(self):
        page = self.page
        per_page = self.get_per_page()
        if page and per_page:
            return int(page), int(per_page)
        if page or per_page: # must have both or none
            raise ValueError("You must specify both {} and {}".format(self.PAGE, self.PER_PAGE))
        return None, None

    def get_per_page(self):
        return self.args.get(self.PER_PAGE, None)

    def is_last_page(self):
        return self.page and int(self.page) == -1

    def set_page(self, page_num):
        self.page = page_num

    def get_format(self):
        return self.args.get(self.FORMAT, 'json')

    def get_include_all(self):
        return self.args.get(self.INCLUDE_ALL, '') == 'true'

    def get_custom_list_data(self):
        if self.is_custom_gene_list() or self.is_custom_ranges_list():
            list_id_str = self.args.get(self.CUSTOM_LIST_DATA)
            try:
                val = uuid.UUID(list_id_str, version=1)
            except ValueError:
                raise ValueError("Invalid custom list id:{}".format(list_id_str))
            custom_list_filter = self.get_custom_list_filter()
            return CustomList(self.is_custom_gene_list(), list_id_str, custom_list_filter)
        return ''

    def get_custom_list_filter(self):
        return self.args.get(self.CUSTOM_LIST_FILTER, '')

    def is_custom_gene_list(self):
        return self.get_gene_list() == CUSTOM_GENE_LIST

    def is_custom_ranges_list(self):
        return self.get_gene_list() == CUSTOM_RANGES_LIST

    def get_custom_gene_search_type(self):
        return self.args.get(self.CUSTOM_GENE_SEARCH_TYPE, 'gene_name')

    def is_custom_gene_name_search_type(self):
        return self.get_custom_gene_search_type() == CUSTOM_GENE_NAME_TYPE

    def is_custom_gene_id_search_type(self):
        return self.get_custom_gene_search_type() == CUSTOM_ID_TYPE


class PredictionToken(object):
    def __init__(self, search_args):
        self.search_args = search_args

    def get(self):
        result = ""
        for key, value in self.search_args.args.items():
            if value != 'undefined':
                result += "{}={},".format(key, value)
        return base64.b64encode(bytes(result, "utf-8")).decode('ascii')


class PredictionSearch(object):
    def __init__(self, db, genome, search_args, enable_guess=True, max_sort_guess=None):
        self.db = db
        self.genome = genome
        self.args = search_args
        self.enable_guess = enable_guess
        self.max_sort_guess = max_sort_guess
        self.warning = ''

    def get_count(self):
        query, params = self.make_query_and_params(count=True)
        cur = self.db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(query, params)
        items = cur.fetchone()[0]
        cur.close()
        return items

    def get_predictions(self):
        upstream = self.args.get_upstream()
        downstream = self.args.get_downstream()
        query, params = self.make_query_and_params(count=False)
        cur = self.db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(query, params)
        predictions = []
        prev_row = None
        for row in cur.fetchall():
            gene_start_str = row[PredictionQueryNames.GENE_BEGIN]
            gene_start = ""
            if gene_start_str:
                gene_start = int(gene_start_str)
            strand = row[PredictionQueryNames.STRAND]
            start = None
            end = None
            if gene_start:
                if strand == '+':
                    start = gene_start - upstream
                    end = gene_start + downstream
                else:
                    start = gene_start - downstream
                    end = gene_start + upstream
            else:
                start = row[PredictionQueryNames.RANGE_START]
                end = row[PredictionQueryNames.RANGE_END]
            row = {
                 'name': self.unique_name_parts(row[PredictionQueryNames.NAME]),
                 'commonName': row[PredictionQueryNames.COMMON_NAME],
                 'chrom': row[PredictionQueryNames.CHROM],
                 'max': str(row[PredictionQueryNames.MAX_VALUE]),
                 'start': str(start),
                 'end': str(end),
                 'values': self.unique_predictions(row[PredictionQueryNames.PRED]),
                 'strand': strand,
            }
            #this messes up my counts can I push it into SQL
            #if row['name'] and self.same_except_name(row, prev_row):
            #    prev_row['name'] += ';' + row['name']
            #    continue
            predictions.append(row)
            prev_row = row
        self.db.rollback()
        cur.close()
        if self.args.is_custom_gene_list():
            self.warning = self.query_for_unused_gene_names()
        return predictions

    @staticmethod
    def unique_name_parts(combined_name):
        parts = sorted(set(combined_name.split("; ")))
        return "; ".join(parts)

    @staticmethod
    def unique_predictions(preds):
        results = []
        starts = set()
        for pred in preds:
            start = pred['start']
            if not start in starts:
                starts.add(start)
                results.append(pred)
        return results


    @staticmethod
    def same_except_name(row, prev_row):
        if not prev_row:
            return False
        check_fields = ['commonName', 'chrom', 'max', 'start', 'end', 'strand']
        for field in check_fields:
            if prev_row[field] != row[field]:
                return False
        return True

    def make_query_and_params(self, count):
        return self.determine_query(count).get_query_and_params()

    def determine_query(self, count):
        if self.args.is_custom_gene_list():
            return self.gene_list_query(count)
        if self.args.is_custom_ranges_list():
            return self.range_list_query(count)
        if self.args.get_sort_by_max():
            return self.max_query(count)
        return self.normal_query(count)

    def get_custom_list_fields(self):
        custom_data_list = self.args.get_custom_list_data()
        key = custom_data_list.key
        if not does_custom_list_exist(self.db, key):
            raise ValueError("No data found for this custom list. Perhaps it has purged.")
        return key, custom_data_list.custom_list_filter

    def gene_list_query(self, count):
        custom_list_key, custom_list_filter = self.get_custom_list_fields()
        limit, offset = self.get_limit_and_offset(count)
        return GeneListQuery(
            schema=self.genome,
            custom_list_id=custom_list_key,
            custom_list_filter=custom_list_filter,
            custom_gene_name_type=self.args.is_custom_gene_name_search_type(),
            model_name=self.args.get_model_name(),
            upstream=self.args.get_upstream(),
            downstream=self.args.get_downstream(),
            limit=limit,
            offset=offset,
            count=count,
            sort_by_max=self.args.get_sort_by_max(),
        )

    def range_list_query(self, count):
        custom_list_key, custom_list_filter = self.get_custom_list_fields()
        limit, offset = self.get_limit_and_offset(count)
        return RangeListQuery(
            schema=self.genome,
            custom_list_id=custom_list_key,
            model_name=self.args.get_model_name(),
            limit=limit,
            offset=offset,
            count=count,
            sort_by_max=self.args.get_sort_by_max(),
        )

    def max_query(self, count):
        guess = None
        if self.enable_guess and self.max_sort_guess:
            guess = self.max_sort_guess
        limit, offset = self.get_limit_and_offset(count)
        return MaxPredictionQuery(
            schema=self.genome,
            gene_list=self.args.get_gene_list(),
            model_name=self.args.get_model_name(),
            upstream=self.args.get_upstream(),
            downstream=self.args.get_downstream(),
            guess=guess,
            limit=limit,
            offset=offset,
            count=count,
        )

    def normal_query(self, count):
        limit, offset = self.get_limit_and_offset(count)
        return PredictionQuery(
            schema=self.genome,
            gene_list=self.args.get_gene_list(),
            model_name=self.args.get_model_name(),
            upstream=self.args.get_upstream(),
            downstream=self.args.get_downstream(),
            limit=limit,
            offset=offset,
            count=count,
        )

    def get_limit_and_offset(self, count):
        if not count:
            page, per_page = self.args.get_page_and_per_page()
            if page and per_page:
                return per_page, (page - 1) * per_page
        return None, None

    def has_max_prediction_guess(self):
        return self.args.get_sort_by_max() and self.max_sort_guess

    def get_per_page(self):
        page, per_page = self.args.get_page_and_per_page()
        return per_page

    def query_for_unused_gene_names(self):
        custom_list_key, custom_list_filter = self.get_custom_list_fields()
        unused_name_query = GeneListUnusedNames(
            schema=self.genome,
            custom_list_id=custom_list_key,
            custom_list_filter=custom_list_filter,
            custom_gene_name_type=self.args.is_custom_gene_name_search_type()
        )
        bad_names = self.get_name_set(unused_name_query.get_query_and_params())
        if bad_names:
            if self.args.is_custom_gene_name_search_type():
                return "Gene names not in our database:\n" + "\n".join(bad_names)
            else:
                return "Gene IDs not in our database:\n" + "\n".join(bad_names)
        return ""

    def get_name_set(self, query_and_param):
        result = set()
        query, params = query_and_param
        cur = self.db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(query, params)
        for row in cur.fetchall():
            result.add(row[0])
        self.db.rollback()
        cur.close
        return result

