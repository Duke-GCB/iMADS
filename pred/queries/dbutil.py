"""
Utility methods for use with psycopg2 connection.
"""


def update_database(db, query, params):
    """
    Execute insert/update with params against the database.
    Commit the changes to the database when done.
    :param db: database connection
    :param query: str: query to execute
    :param params: [object]: list of parameters to use with query
    :return int number of rows effected by update
    """
    cur = db.cursor()
    cur.execute(query, params)
    rowcount = cur.rowcount
    cur.close()
    db.commit()
    return rowcount


def read_database(db, query, params):
    """
    Execute query with params against the database.
    :param db: database connection
    :param query: str: query to execute
    :param params: [object]: list of parameters to use with query
    :return [object] rows returned from query
    """
    rows = []
    cur = db.cursor()
    cur.execute(query, params)
    for row in cur.fetchall():
        rows.append(row)
    cur.close()
    db.commit()
    return rows
