import math
import uuid
import base64
import psycopg2.extras
from pred.customlist import CustomList, does_custom_list_exist, get_gene_name_set
from pred.predictionquery import PredictionQuery
from pred.maxpredictionquery import MaxPredictionQuery
from pred.genelistquery import GeneListQuery
from pred.rangelistquery import RangeListQuery

CUSTOM_GENE_LIST = 'Custom Gene List'
CUSTOM_RANGES_LIST = 'Custom Ranges List'


def get_predictions_with_guess(db, config, genome, args):
    search_args = SearchArgs(config.binding_max_offset, args)
    if search_args.is_last_page():
        last_page = determine_last_page(db, genome, search_args)
        search_args.set_page(last_page)
    search = PredictionSearch(db, genome, search_args, enable_guess=True)
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
    offset = int(prediction['start'])
    for data in prediction['values']:
        start = int(data['start'])
        value = data['value']
        idx = start - offset
        if 0 <= idx <= size:
            if value > values[idx]:
                values[idx] = value
    result = [str(val) for val in values]
    if prediction['strand'] == '-':
        return result[::-1]
    return result


class PredictionQueryNames(object):
    COMMON_NAME = 'common_name'
    NAME = 'name'
    MAX_VALUE = 'max_value'
    CHROM = 'chrom'
    STRAND = 'strand'
    GENE_START = 'gene_start'
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
    MAX_PREDICTION_GUESS = 'maxPredictionGuess'
    FORMAT = 'format'
    INCLUDE_ALL = 'includeAll'
    CUSTOM_LIST_DATA = 'customListData'
    CUSTOM_LIST_FILTER = 'customListFilter'

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

    def get_max_prediction_guess(self):
        return self.args.get(self.MAX_PREDICTION_GUESS)

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
    def __init__(self, db, genome, search_args, enable_guess=True):
        self.db = db
        self.genome = genome
        self.args = search_args
        self.enable_guess = enable_guess
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
        print("QUERY" + query)
        cur = self.db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        #self.saveit(query, params)
        cur.execute(query, params)
        predictions = []
        for row in cur.fetchall():
            gene_start_str = row[PredictionQueryNames.GENE_START]
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
            predictions.append({
                 'name': row[PredictionQueryNames.NAME],
                 'commonName': row[PredictionQueryNames.COMMON_NAME],
                 'chrom': row[PredictionQueryNames.CHROM],
                 'max': str(row[PredictionQueryNames.MAX_VALUE]),
                 'start': str(start),
                 'end': str(end),
                 'values': row[PredictionQueryNames.PRED],
                 'strand': strand,
            })
        self.db.rollback()
        cur.close()
        if self.args.is_custom_gene_list():
            self.warning = self.check_for_unused_gene_names(predictions)
        return predictions

    def saveit(self, query, params):
        for param in params:
            query = query.replace('%s', "'" + str(param) + "'", 1)
        with open("/tmp/jpb.sql", 'w') as outfile:
            outfile.write(query)

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
        if self.enable_guess:
            guess = self.args.get_max_prediction_guess()
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
        return self.args.get_sort_by_max() and self.args.get_max_prediction_guess() != ''

    def get_per_page(self):
        page, per_page = self.args.get_page_and_per_page()
        return per_page

    def check_for_unused_gene_names(self, predictions):
        custom_list_key, custom_list_filter = self.get_custom_list_fields()
        gene_name_set = get_gene_name_set(self.db, custom_list_key)
        name_fields = ['name', 'commonName']
        for prediction in predictions:
            for name in name_fields:
                gene_name = prediction.get(name)
                if gene_name in gene_name_set:
                    gene_name_set.remove(gene_name)
        warning = ''
        num_not_found_names = len(gene_name_set)
        if num_not_found_names > 0:
            if num_not_found_names > 10:
                warning = '{} gene_names were not found in our database.'.format(num_not_found_names)
            else:
                names = ', '.join(gene_name_set)
                warning = 'Gene_name(s) {} were not found in our database.'.format(names)
        return warning
