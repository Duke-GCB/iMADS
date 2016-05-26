"""
Database connection that commits and prints each statement sent to it.
"""
import psycopg2


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
        connect_str = 'host={} dbname={} user={} password={}'.format(self.host, self.dbname, self.user, self.password)
        self.conn = psycopg2.connect(connect_str)

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
            self.update_progress('Execute copy:' + sql.source_path)
            sql.run(self.cur)
        else:
            self.update_progress('Execute sql:' + sql)
            self.cur.execute(sql, params)
        self.conn.commit()
        self.cur.close()
        self.cur = None

    def close(self):
        """
        Cleanup database connection.
        """
        self.conn.close()
        self.conn = None


class CopyCommand(object):
    def __init__(self, destination, source_path):
        self.destination = destination
        self.source_path = source_path

    def run(self, cursor):
        with open(self.source_path) as infile:
            cursor.copy_from(infile, self.destination)