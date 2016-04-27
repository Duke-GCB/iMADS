from pred.querybuilder import QueryBuilder
from pred.predictionqueryparts import *


class RangeListQuery(object):
    def __init__(self, schema, range_list, model_name, limit="", offset="", count=False, sort_by_max=False):
        self.schema = schema
        self.range_list = range_list
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
        query_parts = [create_custom_range_list_temp_table()]
        for name, chrom, start, end in self.range_list:
            query_parts.append(insert_custom_range_list(name, chrom, start, end))
        query_parts.append(create_index_custom_range_list())
        if self.count:
            query_parts.append(begin_count())
        query_parts.append(custom_range_list_query(self.model_name))
        if self.sort_by_max:
            query_parts.append(order_by_max_value_desc())
        else:
            query_parts.append(order_by_name())
        if self.limit:
            query_parts.append(limit_and_offset(self.limit, self.offset))
        if self.count:
            query_parts.append(end_count())
        return query_parts

