from unittest import TestCase
from pred.querybuilder import QueryBuilder
from pred.predictionqueryparts import *


class TestQueryBuilder(TestCase):
    def test_starts_blank(self):
        builder = QueryBuilder()
        query, params = builder.get_query_and_params()
        self.assertEqual("", query)
        self.assertEqual([], params)

    def test_simple_query(self):
        builder = QueryBuilder()
        builder.query.add("select 1 from table where value = %s;", [5])
        query, params = builder.get_query_and_params()
        self.assertEqual("select 1 from table where value = %s;", query)
        self.assertEqual([5], params)

    def test_append_two_items(self):
        builder = QueryBuilder()
        builder.set_schema.add("SET search_path TO %s,public;", ["hg38"])
        builder.query.add("select 1 from table where value = %s;", [5])
        query, params = builder.get_query_and_params()
        expected_sql = "SET search_path TO %s,public;\nselect 1 from table where value = %s;"
        expected_params = ["hg38", 5]
        self.assertEqual(expected_sql, query)
        self.assertEqual(expected_params, params)

    def test_all_items(self):
        builder = QueryBuilder()
        builder.set_schema.add_part(set_search_path("hg38"))
        builder.with_clause.add("WITH regional_sales AS (SELECT amount AS total_sales FROM orders)", [])
        builder.query.add("SELECT * from orders where total_sales > %s;", [200])
        query, params = builder.get_query_and_params()
        expected_sql = """SET search_path TO %s,public;
WITH regional_sales AS (SELECT amount AS total_sales FROM orders)
SELECT * from orders where total_sales > %s;"""
        expected_params = ["hg38", 200]
        self.assertEqual(expected_sql, query)
        self.assertEqual(expected_params, params)


