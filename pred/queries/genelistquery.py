from pred.queries.querybuilder import QueryBuilder
from pred.queries.predictionqueryparts import *


class GeneListQuery(object):
    def __init__(self, schema, custom_list_id, custom_list_filter, custom_gene_name_type,
                 model_name, upstream, downstream,
                 limit="", offset="", count=False, sort_by_max=False):
        self.schema = schema
        self.custom_list_id = custom_list_id
        self.custom_list_filter = custom_list_filter
        self.custom_gene_name_type = custom_gene_name_type
        self.model_name = model_name
        self.upstream = upstream
        self.downstream = downstream
        self.limit = limit
        self.offset = offset
        self.count = count
        self.sort_by_max = sort_by_max

    def get_query_and_params(self):
        builder = QueryBuilder()
        builder.set_schema.add_part(set_search_path(self.schema))
        if self.count:
            builder.query.add_part(begin_count())
        builder.query.add_parts(self.main_query_parts())
        if self.count:
            builder.query.add_part(end_count())
        return builder.get_query_and_params()

    def main_query_parts(self):
        join_filter = filter_gene_list(self.custom_list_filter, self.model_name, self.upstream, self.downstream)
        comparison_fieldname = "name"
        if self.custom_gene_name_type:
            comparison_fieldname = "common_name"
        query_parts = [
            select_prediction_values(table_name="custom_gene_list",
                                     first_field="max(gene_name) as common_name"),
            alias_join_gene_prediction(comparison_fieldname),
            and_sql(),
            join_filter,
            where(),
            id_equals(self.custom_list_id),
            group_by_gene_id(),
        ]
        if not self.count:
            if self.sort_by_max:
                query_parts.append(order_by_max_value_desc_gene_id())
            else:
                query_parts.append(order_by_gene_name())
        if self.limit:
            query_parts.append(limit_and_offset(self.limit, self.offset))
        return query_parts