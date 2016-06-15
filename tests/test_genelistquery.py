from unittest import TestCase
from pred.queries.genelistquery import GeneListQuery, GeneListUnusedNames

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
where{}
( upper(common_name) in (select upper(gene_name) from custom_gene_list where id = %s)
or
upper(name) in (select upper(gene_name) from custom_gene_list where id = %s)
)
and
model_name = %s
and
case strand when '+' then
  (txstart + %s) >= start_range and end_range >= (txstart - %s)
else
  (txend + %s) >= start_range and end_range >= (txend - %s)
end
group by common_name, chrom, strand, txstart, txend
order by common_name{}"""

GENE_LIST_FILTER_WITH_LIMIT = QUERY_BASE.format("\ngene_list = %s\nand", "\nlimit %s offset %s")
GENE_LIST_FILTER = QUERY_BASE.format("", "")

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
( upper(common_name) in (select upper(gene_name) from custom_gene_list where id = %s)
or
upper(name) in (select upper(gene_name) from custom_gene_list where id = %s)
)
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


class TestGeneListQuery(TestCase):
    def test_gene_list_filter_with_limit(self):
        expected_sql = GENE_LIST_FILTER_WITH_LIMIT
        expected_params = ["hg38", "knowngene", 55, 55, "E2F4", "150", "250", "250", "150", "100", "200"]
        query = GeneListQuery(
            schema="hg38",
            custom_list_id=55,
            custom_list_filter='knowngene',
            model_name="E2F4",
            upstream="150",
            downstream="250",
            limit="100",
            offset="200",
        )
        sql, params = query.get_query_and_params()
        self.maxDiff = None
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_gene_list_filter(self):
        expected_sql = GENE_LIST_FILTER
        expected_params = ["hg38", 45, 45, "E2F4", "150", "250", "250", "150"]
        query = GeneListQuery(
            schema="hg38",
            custom_list_id=45,
            custom_list_filter='',
            model_name="E2F4",
            upstream="150",
            downstream="250",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_gene_list_count(self):
        expected_sql = COUNT_QUERY
        expected_params = ["hg38", 77, 77, "E2F4", "150", "250", "250", "150"]
        query = GeneListQuery(
            schema="hg38",
            custom_list_id=77,
            custom_list_filter='All',
            model_name="E2F4",
            upstream="150",
            downstream="250",
            count=True
        )
        self.maxDiff = None
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)


UNUSED_BASE = """SET search_path TO %s,public;
select gene_name from custom_gene_list
where id = %s and not exists
(select 1 from gene where (gene.name = custom_gene_list.gene_name OR
gene.common_name = custom_gene_list.gene_name){})"""
UNUSED_WITH_FILTER = UNUSED_BASE.format("and gene_list = %s")
UNUSED_NO_FILTER = UNUSED_BASE.format("")


class TestGeneListUnusedNames(TestCase):
    def test_unused_with_filter(self):
        expected_params = ["hg38", 55, "knowngene"]
        query = GeneListUnusedNames(
            schema="hg38",
            custom_list_id=55,
            custom_list_filter='knowngene',
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(UNUSED_WITH_FILTER, sql)
        self.assertEqual(expected_params, params)

    def test_unused_no_filter(self):
        expected_params = ["hg38", 55]
        query = GeneListUnusedNames(
            schema="hg38",
            custom_list_id=55,
            custom_list_filter=None,
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(UNUSED_NO_FILTER, sql)
        self.assertEqual(expected_params, params)
