
class PredictionQueryNames(object):
    COMMON_NAME = 'common_name'
    NAME = 'name'
    MAX_VALUE = 'max_value'
    CHROM = 'chrom'
    STRAND = 'strand'
    GENE_START = 'gene_start'
    PRED = 'pred'


class PredictionCountQueryBuilder(object):
    def __init__(self, main_query_func):
        self.main_query_func = main_query_func

    def make_query(self, upstream, downstream):
        main_query = self.main_query_func(upstream, downstream)
        return 'select count(*) from ({}) as foo;'.format(main_query)


class PredictionQueryBuilder(object):
    SET_SCHEMA_SQL = "SET search_path TO %s,public"
    WITH_MAX_PRED_SQL = """with max_prediction_names as (
 select name from gene_prediction"""
    WHERE_BASE = """where
 gene_list = %s
 and
 model_name = %s
 and
 case strand when '+' then
  (txstart - %s) <= start_range and (txstart + %s) >= start_range
 else
  (txend - %s) <= end_range and (txend + %s) >= end_range
 end"""
    VALUE_GT_SQL = " and value > %s"
    GROUP_BY_NAME_SQL = " group by name"
    QUERY_BASE = """select
 max(common_name) as common_name,
 name,
 round(max(value),4) max_value,
 max(chrom) as chrom,
 max(strand) as strand,
 max(case strand when '+' then txstart else txend end) as gene_start,
 json_agg(json_build_object('value', round(value, 4),
  'start', (case strand when '+' then start_range else end_range end))) as pred
 from gene_prediction
 """ + WHERE_BASE
    NAME_IN_MAX_NAMES_SQL = "and name in (select name from max_prediction_names)"
    ORDER_BY_NAME = " order by name"
    ORDER_BY_MAX = " order by max(value) desc"
    ORDER_BY_MAX_AND_NAME = " order by max(value) desc, name"
    LIMIT_OFFSET_SQL = " limit %s offset %s"

    def __init__(self, genome, gene_list, model_name):
        self.genome = genome
        self.gene_list = gene_list
        self.model_name = model_name
        self.limit = None
        self.offset = None
        self.max_value_guess = None
        self.main_query_func = self.sql_query_by_name
        self.params = []

    def set_sort_by_name(self):
        self.main_query_func = self.sql_query_by_name

    def set_sort_by_max(self):
        self.main_query_func = self.sql_query_by_max

    def set_main_query_func(self, main_query_func):
        self.main_query_func = main_query_func

    def set_limit_and_offset(self, limit, offset):
        self.limit = limit
        self.offset = offset

    def set_max_value_guess(self, guess):
        self.max_value_guess = guess

    def join_with_limit(self, parts):
        if self.limit:
            parts.append(self._sql_limit_and_offset())
        return self.join(parts)

    def join(self, parts):
        return '\n'.join(parts)

    def make_query_and_params(self, upstream, downstream):
        self.params = []
        parts = [self._sql_set_search_path(),
                 self.main_query_func(upstream, downstream)]
        query = "\n".join(parts) + ";"
        return query, self.params

    def _sql_set_search_path(self):
        self.params.append(self.genome)
        return self.SET_SCHEMA_SQL + ";"

    def sql_query_by_name(self, upstream, downstream):
        self.params.extend([self.gene_list, self.model_name, upstream, downstream, downstream, upstream])
        return self.join_with_limit([self.QUERY_BASE, self.GROUP_BY_NAME_SQL, self.ORDER_BY_NAME])

    def sql_query_by_max(self, upstream, downstream):
        self.params.extend([self.gene_list, self.model_name, upstream, downstream, downstream, upstream])
        parts = [self.WITH_MAX_PRED_SQL, self.WHERE_BASE]
        if self.max_value_guess:
            self.params.append(self.max_value_guess)
            parts.append(self.VALUE_GT_SQL)
        parts.extend([self.GROUP_BY_NAME_SQL, self.ORDER_BY_MAX])
        with_clause = self.join_with_limit(parts)
        with_clause += "\n)"
        self.params.extend([self.gene_list, self.model_name, upstream, downstream, downstream, upstream])
        return self.join([with_clause, self.QUERY_BASE, self.NAME_IN_MAX_NAMES_SQL,
                          self.GROUP_BY_NAME_SQL, self.ORDER_BY_MAX_AND_NAME])

    def _sql_limit_and_offset(self):
        self.params.extend([self.limit, self.offset])
        return self.LIMIT_OFFSET_SQL


class DataSourcesQueryNames(object):
    DESCRIPTION = 'description'
    DOWNLOADED = 'downloaded'
    URL = 'url'
    DATA_SOURCE_TYPE = 'data_source_type'


class DataSourcesQueryBuilder(object):
    FETCH_DATA_SOURCES_SQL = """select description, downloaded, url, data_source_type from data_source order by downloaded;"""

    def make_query_and_params(self):
        return self.FETCH_DATA_SOURCES_SQL, []
