import psycopg2


class PostgresConnection(object):
    def __init__(self, host, dbname, user, password, update_progress):
        self.host = host
        self.dbname = dbname
        self.user = user
        self.password = password
        self.update_progress = update_progress
        self.conn = None
        self.cur = None

    def create_connection(self):
        self.conn = psycopg2.connect('host=' + self.host +
                                ' dbname=' + self.dbname +
                                ' user=' + self.user +
                                ' password=' + self.password)
        self.cur = self.conn.cursor()

    def commit_close(self):
        self.conn.commit()
        self.cur.close()
        self.conn.close()

    def create_schema(self, schema_name):
        self.update_progress('Creating schema:' + schema_name)
        self.create_connection()
        self.cur.execute('CREATE SCHEMA IF NOT EXISTS ' + schema_name)
        self.commit_close()

    def create_table(self, table_path):
        """
        This loads a schema into the database.
        This schema definition came from UCSC by definition it's a SQL vulnerability.
        :param table_path: str path to a postgres format schema file
        """
        self.update_progress('Creating table:' + table_path)
        self.create_connection()
        with open(table_path, 'r') as infile:
            data = infile.read()
            self.cur.execute(data)
        self.commit_close()

    def execute(self, sql, params=()):
        self.update_progress('Execute sql:' + sql)
        self.create_connection()
        self.cur.execute(sql, params)
        self.commit_close()

    def copy_file_into_db(self, table_name, data_filename, columns=None):
        self.update_progress('Loading table ' + table_name + ' with data:' + data_filename)
        self.create_connection()
        with open(data_filename,'r') as infile:
            self.cur.copy_from(infile, table_name, columns=columns)
        self.commit_close()
