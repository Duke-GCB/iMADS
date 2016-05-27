from pred.queries.querybuilder import QueryPart


def _query_part(sql):
    return QueryPart(sql, [])


def set_search_path(schema):
    return QueryPart("SET search_path TO %s,public;", [schema])


def custom_range_list_query(list_id, model_name):
    return QueryPart("""select '' as name,
'range' || seq as common_name,
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
custom_range_list.id = %s
and model_name = %s
group by seq""", [list_id, model_name])


def select_prediction_values():
    return _query_part("""select
max(common_name) as common_name,
name,
round(max(value), 4) as max_value,
max(chrom) as chrom,
max(strand) as strand,
max(case strand when '+' then txstart else txend end) as gene_start,
json_agg(json_build_object('value', round(value, 4), 'start', start_range, 'end', end_range)) as pred
from gene_prediction""")


def name_in_max_prediction_names():
    return _query_part("and name in (select name from max_prediction_names)")


def filter_gene_list(gene_list, model_name, upstream, downstream):
    return QueryPart("""gene_list = %s
and
model_name = %s
and
case strand when '+' then
(txstart - %s) <= start_range and (txstart + %s) >= start_range
else
(txend - %s) <= end_range and (txend + %s) >= end_range
end""", [gene_list, model_name, upstream, downstream, downstream, upstream])


def filter_common_name(custom_list_id, custom_list_filter, model_name, upstream, downstream):
    if custom_list_filter.strip().upper() == "ALL":
        custom_list_filter = ""
    base_sql = """( upper(common_name) in (select upper(gene_name) from custom_gene_list where id = %s)
or
upper(name) in (select upper(gene_name) from custom_gene_list where id = %s)
)
and
model_name = %s
and
case strand when '+' then
(txstart - %s) <= start_range and (txstart + %s) >= start_range
else
(txend - %s) <= end_range and (txend + %s) >= end_range
end"""
    sql = base_sql
    params = [custom_list_id, custom_list_id, model_name, upstream, downstream, downstream, upstream]
    if custom_list_filter:
        sql = "gene_list = %s\nand\n{}".format(base_sql)
        params.insert(0, custom_list_filter)
    return QueryPart(sql, params)


def items_not_in_gene_list(list_id, gene_list_filter):
    sql = """select gene_name from custom_gene_list
where id = %s and not exists
(select 1 from gene where (gene.name = custom_gene_list.gene_name OR
gene.common_name = custom_gene_list.gene_name)"""
    params = [list_id]
    if gene_list_filter and gene_list_filter.upper() != "ALL":
        sql += "and gene_list = %s"
        params.append(gene_list_filter)
    sql += ")"
    return QueryPart(sql, params)


def with_max_prediction_names():
    return _query_part("""with max_prediction_names as (
 select name from gene_prediction""")


def end_with():
    return _query_part(")")


def where():
    return _query_part("where")


def value_greater_than(value):
    return QueryPart("and value > %s", [value])


def group_by_name():
    return _query_part("group by name")


def order_by_name():
    return _query_part("order by name")


def order_by_common_name():
    return _query_part("order by common_name")


def order_by_common_name_and_name():
    return _query_part("order by common_name, name")


def order_by_seq():
    return _query_part("order by seq")


def order_by_max_value_desc():
    return _query_part("order by max(value) desc")


def order_by_max_value_desc_name():
    return _query_part("order by max(value) desc, name")


def order_by_max_value_desc_common_name():
    return _query_part("order by max(value) desc, common_name")


def limit_and_offset(limit, offset):
    return QueryPart("limit %s offset %s", [limit, offset])


def begin_count():
    return _query_part("select count(*) from (")


def end_count():
    return _query_part(") as foo")


def begin():
    return _query_part("begin;")


def commit():
    return _query_part(";commit;")