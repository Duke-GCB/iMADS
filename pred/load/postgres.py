"""
Database connection that commits and prints each statement sent to it.
"""
import psycopg2


def copy_from(cursor, filename, destination):
    """
    Copy data from filename into the database as table destination.
    This function exists for unit testing.
    :param cursor: Cursor: database connection
    :param filename: str: filename to copy rows from
    :param destination: str: name of the table to copy the data into
    """
    with open(filename) as infile:
        cursor.copy_from(infile, destination)


class PostgresConnection(object):
    def __init__(self, db_config, update_progress):
        """
        Setup database so we can connect.
        :param db_config: pred.Config.db_config: configuration settings to connect to the database
        :param update_progress: func(str): function that gets called with each statement
        """
        self.host = db_config.host
        self.dbname = db_config.dbname
        self.user = db_config.user
        self.password = db_config.password
        self.update_progress = update_progress
        self.conn = None
        self.cur = None

    def create_connection(self):
        """
        Creates a connection to the database.
        :return:
        """
        connect_str = self.get_conn_str()
        self.conn = psycopg2.connect(connect_str)

    def get_conn_str(self):
        """
        Create psycopg2 connection string based on properties.
        :return: str: string for connecting to the database via psycopg2
        """
        return 'host={} dbname={} user={} password={}'.format(self.host, self.dbname, self.user, self.password)

    def execute(self, sql, params=()):
        """
        Run insert/update SQL against the database.
        Connects if it needs to and commits at the end of this method.
        :param sql: str: SQL command to run
        :param params: tuple: parameters for the query
        """

        if not self.conn:
            self.create_connection()
        self.cur = self.conn.cursor()
        if type(sql) is CopyCommand:
            #self.update_progress('Execute copy:' + sql.source_path)
            sql.run(self.cur)
        else:
            #self.update_progress('Execute sql:' + sql)
            self.cur.execute(sql, params)
        self.conn.commit()
        self.cur.close()
        self.cur = None

    def close(self):
        """
        Cleanup database connection.
        """
        if self.conn:
            self.conn.close()
            self.conn = None


class CopyCommand(object):
    def __init__(self, destination, source_path):
        self.destination = destination
        self.source_path = source_path

    def run(self, cursor):
        copy_from(cursor, self.source_path, self.destination)
