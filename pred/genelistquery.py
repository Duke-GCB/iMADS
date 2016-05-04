from pred.querybuilder import QueryBuilder
from pred.predictionqueryparts import *


class GeneListQuery(object):
    def __init__(self, schema, custom_list_id, custom_list_filter, model_name, upstream, downstream,
                 limit="", offset="", count=False, sort_by_max=False):
        self.schema = schema
        self.custom_list_id = custom_list_id
        self.custom_list_filter = custom_list_filter
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
        query_parts = [
            select_prediction_values(),
            where(),
            filter_common_name(self.custom_list_id, self.custom_list_filter, self.model_name, self.upstream, self.downstream),
            group_by_name(),
        ]
        if self.sort_by_max:
            query_parts.append(order_by_max_value_desc_name())
        else:
            query_parts.append(order_by_name())
        if self.limit:
            query_parts.append(limit_and_offset(self.limit, self.offset))
        return query_parts


class GeneListUnusedNames(object):
    def __init__(self, schema, custom_list_id, custom_list_filter):
        self.schema = schema
        self.custom_list_id = custom_list_id
        self.custom_list_filter = custom_list_filter

    def get_query_and_params(self):
        builder = QueryBuilder()
        builder.set_schema.add_part(set_search_path(self.schema))
        builder.query.add_parts([items_not_in_gene_list(self.custom_list_id, self.custom_list_filter)])
        return builder.get_query_and_params()