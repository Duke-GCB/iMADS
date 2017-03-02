from pred.queries.querybuilder import QueryPart


RANGE_OPERATOR = '@>' # contains range - excludes predictions not completely inside gene TSS range


def _query_part(sql):
    return QueryPart(sql, [])


def set_search_path(schema):
    return QueryPart("SET search_path TO %s,public;", [schema])


def custom_range_list_query(list_id, model_name):
    return QueryPart("""select '' as name,
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
and custom_range_list.range {} prediction.range
and model_name = %s
where
custom_range_list.id = %s
group by seq""".format(RANGE_OPERATOR), [model_name, list_id])


def select_prediction_values(table_name="gene_prediction", first_field="common_name"):
    return _query_part("""select
{},
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
from {}""".format(first_field, table_name))


def alias_join_gene_prediction(comparison_fieldname):
    return _query_part("""left outer join gene_symbol_alias on upper(alias) = upper(gene_name)
left outer join gene_prediction on upper({}) in (upper(symbol), upper(alias), upper(gene_name))""".format(comparison_fieldname))


def id_equals(id_value):
    return QueryPart("""id = %s""", [id_value])


def gene_id_in_max_prediction_names():
    return _query_part("and gene_id in (select gene_id from max_prediction_names)")


def filter_gene_list(gene_list, model_name, upstream, downstream):
    """
    Overlapping range filter.
    """
    beginning_sql = ""
    params = []
    if gene_list and gene_list.upper() != 'ALL':
        beginning_sql = "gene_list = %s\nand\n"
        params.append(gene_list)
    params.extend([model_name, upstream, downstream, downstream, upstream])
    return QueryPart(beginning_sql + """model_name = %s
and
case strand when '+' then
  int4range(gene_begin - %s, gene_begin + %s) {} int4range(start_range, end_range)
else
  int4range(gene_begin - %s, gene_begin + %s) {} int4range(start_range, end_range)
end""".format(RANGE_OPERATOR, RANGE_OPERATOR), params)


def items_not_in_gene_list(list_id, gene_list_filter, custom_gene_name_type):
    inner_filter = "upper(gene.name) = upper(custom_gene_list.gene_name)"
    if custom_gene_name_type:
        inner_filter = "upper(gene.common_name) = upper(custom_gene_list.gene_name)"
    sql = """select gene_name from custom_gene_list
where id = %s and not exists
(select 1 from gene where ({})""".format(inner_filter)
    params = [list_id]
    if gene_list_filter and gene_list_filter.upper() != "ALL":
        sql += "and gene_list = %s"
        params.append(gene_list_filter)
    sql += ")"
    return QueryPart(sql, params)


def with_max_prediction_names():
    return _query_part("""with max_prediction_names as (
 select gene_id from gene_prediction""")


def end_with():
    return _query_part(")")


def where():
    return _query_part("where")


def value_greater_than(value):
    return QueryPart("and abs(value) > %s", [value])


def group_by_name():
    return _query_part("group by name")


def group_by_common_name_and_parts(first_field="common_name"):
    return _query_part("group by {}, chrom, strand, gene_begin".format(first_field))


def group_by_gene_id():
    return _query_part("group by gene_id")


def order_by_gene_id():
    return _query_part("order by gene_id")

def order_by_chrom_and_txstart():
    return _query_part("order by chrom, gene_begin")


def order_by_name():
    return _query_part("order by name")


def order_by_gene_name():
    return _query_part("order by max(gene_name)")


def order_by_common_name_and_name():
    return _query_part("order by common_name, name")

def order_by_seq():
    return _query_part("order by seq")


def order_by_max_value_desc():
    return _query_part("order by max(abs(value)) desc")


def order_by_max_value_desc_gene_id():
    return _query_part("order by max(abs(value)) desc, gene_id")


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

def and_sql():
    return _query_part("and")
