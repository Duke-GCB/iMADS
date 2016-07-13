from unittest import TestCase
from pred.queries.predictionquery import PredictionQuery

QUERY_BASE = """SET search_path TO %s,public;
select
common_name,
string_agg(name, '; ') as name,
round(max(value), 4) as max_value,
chrom,
strand,
case strand when '+' then txstart else txend end as gene_start,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred
from gene_prediction
where
gene_list = %s
and
model_name = %s
and
case strand when '+' then
  (txstart + %s) >= start_range and end_range >= (txstart - %s)
else
  (txend + %s) >= start_range and end_range >= (txend - %s)
end
group by common_name, chrom, strand, txstart, txend
order by chrom, txstart{}"""

GENE_LIST_FILTER_WITH_LIMIT = QUERY_BASE.format("\nlimit %s offset %s")
GENE_LIST_FILTER = QUERY_BASE.format("")

COUNT_QUERY = """SET search_path TO %s,public;
select count(*) from (
select
common_name,
string_agg(name, '; ') as name,
round(max(value), 4) as max_value,
chrom,
strand,
case strand when '+' then txstart else txend end as gene_start,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred
from gene_prediction
where
gene_list = %s
and
model_name = %s
and
case strand when '+' then
  (txstart + %s) >= start_range and end_range >= (txstart - %s)
else
  (txend + %s) >= start_range and end_range >= (txend - %s)
end
group by common_name, chrom, strand, txstart, txend
) as foo"""

class TestPredictionQuery(TestCase):
    def test_filter_with_limit(self):
        expected_sql = GENE_LIST_FILTER_WITH_LIMIT
        expected_params = ["hg38", "knowngene", "E2F4", "250", "150", "150", "250", "100", "200"]
        query = PredictionQuery(
            schema="hg38",
            gene_list="knowngene",
            model_name="E2F4",
            upstream="150",
            downstream="250",
            limit="100",
            offset="200",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_filter(self):
        expected_sql = GENE_LIST_FILTER
        expected_params = ["hg38", "knowngene", "E2F4", "250", "150", "150", "250"]
        query = PredictionQuery(
            schema="hg38",
            gene_list="knowngene",
            model_name="E2F4",
            upstream="150",
            downstream="250",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_count(self):
        expected_sql = COUNT_QUERY
        expected_params = ["hg38", "knowngene", "E2F4", "250", "150", "150", "250"]
        query = PredictionQuery(
            schema="hg38",
            gene_list="knowngene",
            model_name="E2F4",
            upstream="150",
            downstream="250",
            count=True,
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)



