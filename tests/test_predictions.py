from unittest import TestCase
from predictions import PredictionQueryBuilder

SET_SCHEMA_SQL = PredictionQueryBuilder.SET_SCHEMA_SQL
WHERE_BASE = PredictionQueryBuilder.WHERE_BASE
QUERY_BASE = PredictionQueryBuilder.QUERY_BASE
LIMIT_OFFSET_SQL = PredictionQueryBuilder.LIMIT_OFFSET_SQL
ORDER_BY_NAME = PredictionQueryBuilder.ORDER_BY_NAME
WITH_MAX_PRED_SQL = PredictionQueryBuilder.WITH_MAX_PRED_SQL
ORDER_BY_MAX = PredictionQueryBuilder.ORDER_BY_MAX
ORDER_BY_MAX_AND_NAME = PredictionQueryBuilder.ORDER_BY_MAX_AND_NAME
NAME_IN_MAX_NAMES_SQL = PredictionQueryBuilder.NAME_IN_MAX_NAMES_SQL
GROUP_BY_NAME_SQL = PredictionQueryBuilder.GROUP_BY_NAME_SQL
VALUE_GT_SQL = PredictionQueryBuilder.VALUE_GT_SQL


class TestPredictionQueryBuilder(TestCase):
    def schema_sql(self, parts):
        return '\n'.join([SET_SCHEMA_SQL + ";", *parts]) + ";"

    def print_query(self, title, query, params):
        print(title)
        fixed = query.replace("%s","{}")
        fixed_params = ["'{}'".format(param) for param in params]
        print(fixed.format(*fixed_params))

    def test_sort_by_name_all_query(self):
        query_builder = PredictionQueryBuilder('hg38','knowngene','E2F1')
        upstream = 200
        downstream = 100
        query, params = query_builder.make_query_and_params(upstream, downstream)
        expected_query = self.schema_sql([QUERY_BASE, GROUP_BY_NAME_SQL, ORDER_BY_NAME])
        self.assertEqual(expected_query, query)
        self.assertEqual(['hg38','knowngene','E2F1',upstream, downstream, downstream, upstream], params)

        self.print_query("All", query, params)

    def test_sort_by_name_limit(self):
        query_builder = PredictionQueryBuilder('hg38', 'knowngene', 'E2F1')
        upstream = 200
        downstream = 100
        limit = 20
        offset = 10
        query_builder.set_main_query_func(query_builder.sql_query_by_name)
        query_builder.set_limit_and_offset(limit, offset)
        query, params = query_builder.make_query_and_params(upstream, downstream)
        expected_query = self.schema_sql([QUERY_BASE, GROUP_BY_NAME_SQL, ORDER_BY_NAME, LIMIT_OFFSET_SQL])
        self.assertEqual(expected_query, query)
        self.assertEqual(['hg38', 'knowngene', 'E2F1', upstream, downstream, downstream, upstream, limit, offset], params)

    def test_sort_by_max_all_query(self):
        query_builder = PredictionQueryBuilder('hg38', 'knowngene', 'E2F1')
        upstream = 200
        downstream = 100
        query_builder.set_main_query_func(query_builder.sql_query_by_max)
        query, params = query_builder.make_query_and_params(upstream, downstream)
        expected_query = self.schema_sql([WITH_MAX_PRED_SQL,
                                          WHERE_BASE,
                                          GROUP_BY_NAME_SQL,
                                          ORDER_BY_MAX,
                                          ")",
                                          QUERY_BASE,
                                          NAME_IN_MAX_NAMES_SQL,
                                          GROUP_BY_NAME_SQL,
                                          ORDER_BY_MAX_AND_NAME
                                          ])
        expected_params = ['hg38', 'knowngene', 'E2F1', upstream, downstream, downstream, upstream,
                           # limit and offset
                           'knowngene', 'E2F1', upstream, downstream, downstream, upstream,
                           ]
        self.assertEqual(expected_query, query)
        self.assertEqual(expected_params, params)

    def test_sort_by_max_limit_query(self):
        query_builder = PredictionQueryBuilder('hg38', 'knowngene', 'E2F1')
        upstream = 200
        downstream = 100
        limit = 20
        offset = 10
        query_builder.set_limit_and_offset(limit, offset)
        query_builder.set_main_query_func(query_builder.sql_query_by_max)
        query, params = query_builder.make_query_and_params(upstream, downstream)
        expected_query = self.schema_sql([WITH_MAX_PRED_SQL,
                                          WHERE_BASE,
                                          GROUP_BY_NAME_SQL,
                                          ORDER_BY_MAX,
                                          LIMIT_OFFSET_SQL,
                                          ")",
                                          QUERY_BASE,
                                          NAME_IN_MAX_NAMES_SQL,
                                          GROUP_BY_NAME_SQL,
                                          ORDER_BY_MAX_AND_NAME
                                          ])
        expected_params = ['hg38', 'knowngene', 'E2F1', upstream, downstream, downstream, upstream,
                           limit, offset,
                           'knowngene', 'E2F1', upstream, downstream, downstream, upstream,
                           ]
        self.assertEqual(expected_query, query)
        self.assertEqual(expected_params, params)

    def test_sort_by_max_limit_and_guess_query(self):
        query_builder = PredictionQueryBuilder('hg38', 'knowngene', 'E2F1')
        upstream = 200
        downstream = 100
        limit = 20
        offset = 10
        query_builder.set_limit_and_offset(limit, offset)
        query_builder.set_max_value_guess('0.4')
        query_builder.set_main_query_func(query_builder.sql_query_by_max)
        query, params = query_builder.make_query_and_params(upstream, downstream)
        expected_query = self.schema_sql([WITH_MAX_PRED_SQL,
                                          WHERE_BASE,
                                          VALUE_GT_SQL,
                                          GROUP_BY_NAME_SQL,
                                          ORDER_BY_MAX,
                                          LIMIT_OFFSET_SQL,
                                          ")",
                                          QUERY_BASE,
                                          NAME_IN_MAX_NAMES_SQL,
                                          GROUP_BY_NAME_SQL,
                                          ORDER_BY_MAX_AND_NAME
                                          ])
        expected_params = ['hg38', 'knowngene', 'E2F1', upstream, downstream, downstream, upstream, '0.4',
                           limit, offset,
                           'knowngene', 'E2F1', upstream, downstream, downstream, upstream,
                           ]
        self.assertEqual(expected_query, query)
        self.assertEqual(expected_params, params)
