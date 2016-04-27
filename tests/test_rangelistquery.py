from unittest import TestCase
from pred.rangelistquery import RangeListQuery

QUERY_BASE = """SET search_path TO %s,public;
create temp table custom_range_list (
rangename varchar,
chrom varchar,
range int4range
) ON COMMIT DROP;{}
create index custom_range_list_idx on custom_range_list using gist(range);analyze custom_range_list;
select rangename as name,
rangename as common_name,
max(custom_range_list.chrom) as chrom,
'' as strand,
'' as gene_start,
 round(max(value),4) as max_value,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred,
max(lower(custom_range_list.range)) as range_start,
max(upper(custom_range_list.range)) as range_end
from custom_range_list
inner join prediction
on prediction.chrom = custom_range_list.chrom
and custom_range_list.range && prediction.range
where
model_name = %s
group by rangename
order by name{}"""

INSERT_INTO_TEMP = "\ninsert into custom_range_list values (%s, %s, int4range(%s, %s));"
LIMIT_OFFSET = "\nlimit %s offset %s"

QUERY_WITH_COUNT = """SET search_path TO %s,public;
create temp table custom_range_list (
rangename varchar,
chrom varchar,
range int4range
) ON COMMIT DROP;{}
create index custom_range_list_idx on custom_range_list using gist(range);analyze custom_range_list;
select count(*) from (
select rangename as name,
rangename as common_name,
max(custom_range_list.chrom) as chrom,
'' as strand,
'' as gene_start,
 round(max(value),4) as max_value,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred,
max(lower(custom_range_list.range)) as range_start,
max(upper(custom_range_list.range)) as range_end
from custom_range_list
inner join prediction
on prediction.chrom = custom_range_list.chrom
and custom_range_list.range && prediction.range
where
model_name = %s
group by rangename
order by name{}
) as foo"""


class TestRangeListQuery(TestCase):
    def test_range_list_filter_with_limit(self):
        expected_sql = QUERY_BASE.format(INSERT_INTO_TEMP, LIMIT_OFFSET)
        expected_params = ["hg38",
                           "range1", "chr2", "12929", "13348",
                           "E2F4",
                           "100", "200"]
        query = RangeListQuery(
            schema="hg38",
            range_list=[
                ("range1", "chr2", "12929", "13348")
            ],
            model_name="E2F4",
            limit="100",
            offset="200",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_range_list_filter_with_limit_multi_insert(self):
        expected_sql = QUERY_BASE.format(INSERT_INTO_TEMP + INSERT_INTO_TEMP, LIMIT_OFFSET)
        expected_params = ["hg38",
                           "range1", "chr2", "12929", "13348",
                           "range2", "chr15", "52929", "63348",
                           "E2F4",
                           "100", "200"]
        query = RangeListQuery(
            schema="hg38",
            range_list=[
                ("range1", "chr2", "12929", "13348"),
                ("range2", "chr15", "52929", "63348")
            ],
            model_name="E2F4",
            limit="100",
            offset="200",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_range_list_filter(self):
        expected_sql = QUERY_BASE.format(INSERT_INTO_TEMP, "")
        expected_params = ["hg38",
                           "range1", "chr2", "12929", "13348",
                           "E2F4"]
        query = RangeListQuery(
            schema="hg38",
            range_list=[
                ("range1", "chr2", "12929", "13348")
            ],
            model_name="E2F4",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_range_list_count(self):
        expected_sql = QUERY_WITH_COUNT.format(INSERT_INTO_TEMP, "")
        expected_params = ["hg38",
                           "range1", "chr2", "12929", "13348",
                           "E2F4"]
        query = RangeListQuery(
            schema="hg38",
            range_list=[
                ("range1", "chr2", "12929", "13348")
            ],
            model_name="E2F4",
            count=True,
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)



