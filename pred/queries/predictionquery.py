from pred.queries.querybuilder import QueryBuilder
from pred.queries.predictionqueryparts import *


class PredictionQuery(object):
    def __init__(self, schema, gene_list, model_name, upstream, downstream, limit="", offset="", count=False):
        self.schema = schema
        self.gene_list = gene_list
        self.model_name = model_name
        self.upstream = upstream
        self.downstream = downstream
        self.limit = limit
        self.offset = offset
        self.count = count

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
            filter_gene_list(self.gene_list, self.model_name, self.upstream, self.downstream),
            group_by_common_name_and_parts(),
        ]
        if not self.count:
            query_parts.append(order_by_common_name_and_parts())
        if self.limit:
            query_parts.append(limit_and_offset(self.limit, self.offset))
        return query_parts
