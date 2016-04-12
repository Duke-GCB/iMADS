import psycopg2.extras

from pred.querybuilder import PredictionQueryBuilder, PredictionQueryNames


def get_predictions_with_guess(db, config, genome, args):
    search = PredictionSearch(db, genome, config.binding_max_offset, args, enable_guess=True)
    predictions = search.get_predictions()
    if search.has_max_prediction_guess():  # repeat without guess if we didn't get enough values
        per_page = search.get_per_page()
        if per_page:
            if len(predictions) < per_page:
                search.enable_guess = False
                predictions = search.get_predictions()
    return predictions, search.args


def get_all_values(prediction, size):
    values = [0] * size
    offset = int(prediction['start'])
    for data in prediction['values']:
        start = int(data['start'])
        value = data['value']
        idx = start - offset
        values[idx] = value
    return [str(val) for val in values]


class SearchArgs(object):
    GENE_LIST = 'gene_list'
    MODEL = 'protein'
    UPSTREAM = 'upstream'
    DOWNSTREAM = 'downstream'
    PAGE = 'page'
    PER_PAGE = 'per_page'
    MAX_PREDICTION_SORT = 'max_prediction_sort'
    MAX_PREDICTION_GUESS = 'max_prediction_guess'
    FORMAT = 'format'
    INCLUDE_ALL = 'include_all'

    def __init__(self, max_stream_val, args):
        self.max_stream_val = max_stream_val
        self.args = args

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
        page = self.args.get(self.PAGE, None)
        per_page = self.args.get(self.PER_PAGE, None)
        if page and per_page:
            return int(page), int(per_page)
        if page or per_page: # must have both or none
            raise ValueError("You must specify both {} and {}".format(self.PAGE, self.PER_PAGE))
        return None, None

    def get_format(self):
        return self.args.get(self.FORMAT, 'json')

    def get_include_all(self):
        return self.args.get(self.INCLUDE_ALL, '') == 'true'


class PredictionSearch(object):
    def __init__(self, db, genome, max_stream_val, args, enable_guess=True):
        self.db = db
        self.genome = genome
        self.args = SearchArgs(max_stream_val, args)
        self.enable_guess = enable_guess

    def get_predictions(self):
        upstream = self.args.get_upstream()
        downstream = self.args.get_downstream()
        query, params = self._create_query_and_params()
        cur = self.db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(query, params)
        predictions = []
        for row in cur.fetchall():
            gene_start = int(row[PredictionQueryNames.GENE_START])
            strand = row[PredictionQueryNames.STRAND]
            start = None
            end = None
            if strand == '+':
                start = gene_start - upstream
                end = gene_start + downstream
            else:
                start = gene_start - downstream
                end = gene_start + upstream
            predictions.append({
                 'name': row[PredictionQueryNames.NAME],
                 'common_name': row[PredictionQueryNames.COMMON_NAME],
                 'chrom': row[PredictionQueryNames.CHROM],
                 'max': str(row[PredictionQueryNames.MAX_VALUE]),
                 'start': str(start),
                 'end': str(end),
                 'values': row[PredictionQueryNames.PRED],
                 'strand': strand,
            })
        cur.close()
        return predictions

    def _create_query_and_params(self):
        builder = PredictionQueryBuilder(self.genome, self.args.get_gene_list(), self.args.get_model_name())
        self._try_set_limit_and_offset(builder)
        self._try_set_max_sort(builder)
        return builder.make_query_and_params(self.args.get_upstream(), self.args.get_downstream())

    def _try_set_limit_and_offset(self, builder):
        page, per_page = self.args.get_page_and_per_page()
        if page and per_page:
            builder.set_limit_and_offset(per_page, (page - 1) * per_page)

    def _try_set_max_sort(self, builder):
        if self.args.get_sort_by_max():
            builder.set_sort_by_max()
            if self.enable_guess:
                guess = self.args.get_max_prediction_guess()
                if guess:
                    builder.set_max_value_guess(guess)
        else:
            builder.set_sort_by_name()

    def has_max_prediction_guess(self):
        return self.args.get_sort_by_max() and self.args.get_max_prediction_guess() != ''

    def get_per_page(self):
        page, per_page = self.args.get_page_and_per_page()
        return per_page

