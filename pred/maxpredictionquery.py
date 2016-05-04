from pred.querybuilder import QueryBuilder
from pred.predictionqueryparts import *


class MaxPredictionQuery(object):
    def __init__(self, schema, gene_list, model_name, upstream, downstream, guess="", limit="", offset="", count=False):
        self.schema = schema
        self.gene_list = gene_list
        self.model_name = model_name
        self.upstream = upstream
        self.downstream = downstream
        self.guess = guess
        self.limit = limit
        self.offset = offset
        self.count = count

    def get_query_and_params(self):
        builder = QueryBuilder()
        builder.set_schema.add_part(set_search_path(self.schema))
        builder.with_clause.add_parts(self.with_clause_parts())
        if self.count:
            builder.query.add_part(begin_count())
        builder.query.add_parts(self.main_query_parts())
        if self.count:
            builder.query.add_part(end_count())
        return builder.get_query_and_params()

    def with_clause_parts(self):
        with_parts = [
            with_max_prediction_names(),
            where(),
            filter_gene_list(self.gene_list, self.model_name, self.upstream, self.downstream),
        ]
        if self.guess:
            with_parts.append(value_greater_than(self.guess))
        with_parts.append(group_by_name())
        with_parts.append(order_by_max_value_desc())
        if self.limit:
            with_parts.append(limit_and_offset(self.limit, self.offset))
        with_parts.append(end_with())
        return with_parts

    def main_query_parts(self):
        query_parts = [
            select_prediction_values(),
            where(),
            filter_gene_list(self.gene_list, self.model_name, self.upstream, self.downstream),
            name_in_max_prediction_names(),
            group_by_name(),
            order_by_max_value_desc_name()
        ]
        return query_parts

