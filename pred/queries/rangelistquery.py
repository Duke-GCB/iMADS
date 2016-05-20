from pred.queries.querybuilder import QueryBuilder
from pred.queries.predictionqueryparts import *


class RangeListQuery(object):
    def __init__(self, schema, custom_list_id, model_name, limit="", offset="", count=False, sort_by_max=False):
        self.schema = schema
        self.custom_list_id = custom_list_id
        self.model_name = model_name
        self.limit = limit
        self.offset = offset
        self.count = count
        self.sort_by_max = sort_by_max

    def get_query_and_params(self):
        builder = QueryBuilder()
        builder.set_schema.add_part(set_search_path(self.schema))
        builder.query.add_parts(self.main_query_parts())
        return builder.get_query_and_params()

    def main_query_parts(self):
        query_parts = []
        if self.count:
            query_parts.append(begin_count())
        query_parts.append(custom_range_list_query(self.custom_list_id, self.model_name))
        if self.sort_by_max:
            query_parts.append(order_by_max_value_desc())
        else:
            query_parts.append(order_by_seq())
        if self.limit:
            query_parts.append(limit_and_offset(self.limit, self.offset))
        if self.count:
            query_parts.append(end_count())
        return query_parts

