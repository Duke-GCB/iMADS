class QueryBuilder(object):
    def __init__(self):
        self.set_schema = QueryPart("", [])
        self.with_clause = QueryPart("", [])
        self.query = QueryPart("", [])

    def get_query_and_params(self):
        """
        Combine the sql and param from parts.
        """
        parts = [self.set_schema, self.with_clause, self.query]
        sql = ""
        params = []
        prefix = ""
        for part in parts:
            if part.sql:
                sql += prefix + part.sql
                params.extend(part.params)
                prefix = "\n"
        return sql, params


class QueryPart(object):
    def __init__(self, sql, params):
        self.sql = sql
        self.params = params

    def add(self, sql, params):
        if self.sql and sql:
            self.sql += "\n"
        self.sql += sql
        self.params.extend(params)

    def add_part(self, part):
        self.add(part.sql, part.params)

    def add_parts(self, parts):
        for part in parts:
            self.add_part(part)