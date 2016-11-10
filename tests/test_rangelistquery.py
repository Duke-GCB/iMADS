from unittest import TestCase
from pred.queries.rangelistquery import RangeListQuery

QUERY_BASE = """SET search_path TO %s,public;
select '' as name,
'range' || seq as common_name,
max(custom_range_list.chrom) as chrom,
'' as strand,
'' as gene_begin,
case WHEN max(value) > abs(min(value)) THEN
  round(max(value), 4)
ELSE
  round(min(value), 4)
end as max_value,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred,
max(lower(custom_range_list.range)) as range_start,
max(upper(custom_range_list.range)) as range_end
from custom_range_list
left outer join prediction
on prediction.chrom = custom_range_list.chrom
and custom_range_list.range @> prediction.range
and model_name = %s
where
custom_range_list.id = %s
group by seq
order by seq{}"""

LIMIT_OFFSET = "\nlimit %s offset %s"

QUERY_WITH_COUNT = """SET search_path TO %s,public;
select count(*) from (
select '' as name,
'range' || seq as common_name,
max(custom_range_list.chrom) as chrom,
'' as strand,
'' as gene_begin,
case WHEN max(value) > abs(min(value)) THEN
  round(max(value), 4)
ELSE
  round(min(value), 4)
end as max_value,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred,
max(lower(custom_range_list.range)) as range_start,
max(upper(custom_range_list.range)) as range_end
from custom_range_list
left outer join prediction
on prediction.chrom = custom_range_list.chrom
and custom_range_list.range @> prediction.range
and model_name = %s
where
custom_range_list.id = %s
group by seq
order by seq{}
) as foo"""


class TestRangeListQuery(TestCase):
    def test_range_list_filter_with_limit(self):
        expected_sql = QUERY_BASE.format(LIMIT_OFFSET)
        expected_params = ["hg38",
                           "E2F4",
                           12,
                           "100", "200"]
        query = RangeListQuery(
            schema="hg38",
            custom_list_id=12,
            model_name="E2F4",
            limit="100",
            offset="200",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_range_list_filter_with_limit_multi_insert(self):
        expected_sql = QUERY_BASE.format(LIMIT_OFFSET)
        expected_params = ["hg38", "E2F4", 22, "100", "200"]
        query = RangeListQuery(
            schema="hg38",
            custom_list_id=22,
            model_name="E2F4",
            limit="100",
            offset="200",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_range_list_filter(self):
        expected_sql = QUERY_BASE.format("")
        expected_params = ["hg38", "E2F4", 18]
        query = RangeListQuery(
            schema="hg38",
            custom_list_id=18,
            model_name="E2F4",
        )
        sql, params = query.get_query_and_params()
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)

    def test_range_list_count(self):
        expected_sql = QUERY_WITH_COUNT.format("")
        expected_params = ["hg38", "E2F4", 48]
        query = RangeListQuery(
            schema="hg38",
            custom_list_id=48,
            model_name="E2F4",
            count=True,
        )
        sql, params = query.get_query_and_params()
        self.maxDiff = None
        self.assertEqual(expected_sql, sql)
        self.assertEqual(expected_params, params)



