from unittest import TestCase
from pred.queries.genelistquery import GeneListQuery
from pred.webserver.predictionsearch import CUSTOM_GENE_NAME_TYPE, CUSTOM_ID_TYPE

QUERY_BASE = """SET search_path TO %s,public;
select
max(gene_name) as common_name,
string_agg(name, '; ') as name,
case WHEN max(value) > abs(min(value)) THEN
  round(max(value), 4)
ELSE
  round(min(value), 4)
end as max_value,
max(chrom) as chrom,
max(strand) as strand,
max(gene_begin) as gene_begin,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred
from custom_gene_list
left outer join gene_symbol_alias on upper(alias) = upper(gene_name)
left outer join gene_prediction on upper(common_name) in (upper(symbol), upper(alias), upper(gene_name))
and{}
model_name = %s
and
case strand when '+' then
  int4range(gene_begin - %s, gene_begin + %s) @> int4range(start_range, end_range)
else
  int4range(gene_begin - %s, gene_begin + %s) @> int4range(start_range, end_range)
end
where
id = %s
group by gene_id
order by max(gene_name){}"""

GENE_LIST_FILTER_WITH_LIMIT = QUERY_BASE.format("\ngene_list = %s\nand", "\nlimit %s offset %s")
GENE_LIST_FILTER = QUERY_BASE.format("", "")

COUNT_QUERY = """SET search_path TO %s,public;
select count(*) from (
select
max(gene_name) as common_name,
string_agg(name, '; ') as name,
case WHEN max(value) > abs(min(value)) THEN
  round(max(value), 4)
ELSE
  round(min(value), 4)
end as max_value,
max(chrom) as chrom,
max(strand) as strand,
max(gene_begin) as gene_begin,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred
from custom_gene_list
left outer join gene_symbol_alias on upper(alias) = upper(gene_name)
left outer join gene_prediction on upper(common_name) in (upper(symbol), upper(alias), upper(gene_name))
and
model_name = %s
and
case strand when '+' then
  int4range(gene_begin - %s, gene_begin + %s) @> int4range(start_range, end_range)
else
  int4range(gene_begin - %s, gene_begin + %s) @> int4range(start_range, end_range)
end
where
id = %s
group by gene_id
) as foo"""


class TestGeneListQuery(TestCase):
    def test_gene_list_filter_with_limit(self):
        expected_sql = GENE_LIST_FILTER_WITH_LIMIT
        expected_params = ["hg38", "knowngene", "E2F4", "250", "150", "150", "250", 55, "100", "200"]
        query = GeneListQuery(
            schema="hg38",
            custom_list_id=55,
            custom_list_filter='knowngene',
            custom_gene_name_type=CUSTOM_GENE_NAME_TYPE,
            model_name="E2F4",
            upstream="150",
            downstream="250",
            limit="100",
            offset="200",
        )
        sql, params = query.get_query_and_params()
        self.maxDiff = None
        self.assertMultiLineEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_gene_list_filter(self):
        expected_sql = GENE_LIST_FILTER
        expected_params = ["hg38", "E2F4", "250", "150", "150", "250", 45]
        query = GeneListQuery(
            schema="hg38",
            custom_list_id=45,
            custom_list_filter='',
            custom_gene_name_type=CUSTOM_GENE_NAME_TYPE,
            model_name="E2F4",
            upstream="150",
            downstream="250",
        )
        sql, params = query.get_query_and_params()
        self.maxDiff = None
        self.assertMultiLineEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_gene_list_count(self):
        expected_sql = COUNT_QUERY
        expected_params = ["hg38", "E2F4", "250", "150", "150", "250", 77]
        query = GeneListQuery(
            schema="hg38",
            custom_list_id=77,
            custom_list_filter='',
            custom_gene_name_type=CUSTOM_GENE_NAME_TYPE,
            model_name="E2F4",
            upstream="150",
            downstream="250",
            count=True
        )
        sql, params = query.get_query_and_params()
        self.maxDiff = None
        self.assertMultiLineEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

