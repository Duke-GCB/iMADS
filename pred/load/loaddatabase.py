"""
Inserts predictions, gene lists, and entries about files downloaded into a database.
Based on predictionsconf.yaml and files downloaded/created via download.download_and_convert
create/run SQL to load the data into the database. Runs some SQL in parallel.
"""
from __future__ import print_function
import os
import sys
import datetime
from multiprocessing import Pool
from jinja2 import FileSystemLoader, Environment
from pred.load.download import GenomeDownloader, GeneListDownloader, PredictionDownloader, GENE_LIST_HOST
from pred.load.postgres import PostgresConnection, CopyCommand
from psycopg2 import OperationalError

SQL_TEMPLATE_DIR = 'sql_templates'


def create_sql_pipeline(config, update_progress):
    """
    Build up a pipeline of sql commands to be run based on config
    :param config: Config: contains list of genomes and files/lists we will insert into the database.
    :param update_progress: func(str): will be called with progress messages
    :return: SQLBuilder: containing a SQL pipeline that can be run with run_sql
    """
    sql_builder = SQLBuilder(SQL_TEMPLATE_DIR)
    sql_builder.create_data_source()
    sql_builder.create_custom_list()
    for genome_data in config.genome_data_list:
        database_loader = DatabaseLoader(config, genome_data, sql_builder, update_progress)
        create_pipeline_for_genome_version(database_loader)
    return sql_builder.sql_pipeline


def create_pipeline_for_genome_version(database_loader):
    """
    Add sql commands for a particular genome version to sql_builder both specified in database_loader.
    :param database_loader: DatabaseLoader: used to adds various SQL commands to sql_builder
    """
    database_loader.create_schema_and_base_tables()
    database_loader.insert_genome_data_source()
    database_loader.insert_gene_list_files()
    database_loader.insert_prediction_files()
    database_loader.create_gene_and_prediction_indexes()
    database_loader.create_gene_prediction()
    database_loader.delete_sql_for_gene_list_files()


def get_modified_time_for_filename(filename):
    """
    Return the modified time for a filename.
    This function exists to support unit testing.
    :param filename: str: path to exiting file
    :return: int: number of seconds since epoch
    """
    return os.path.getmtime(filename)


def sql_from_filename(filename):
    """
    Given a filename return the SQL it contains.
    This function exists to support unit testing.
    :param filename:  path to exiting file containing SQL
    :return: str: sql commands to execute
    """
    with open(filename, 'r') as infile:
        return infile.read() + "\n"


class DatabaseLoader(object):
    def __init__(self, config, genome_data, sql_builder, update_progress):
        self.config = config
        self.genome_data = genome_data
        self.genome = genome_data.genomename
        self.sql_builder = sql_builder
        self.update_progress = update_progress

    def create_schema_and_base_tables(self):
        self.sql_builder.create_schema(self.genome, self.config.dbconfig.user)
        self.sql_builder.create_base_tables(self.genome)

    def insert_genome_data_source(self):
        downloader = GenomeDownloader(self.config.download_dir,
                                      GENE_LIST_HOST,
                                      self.genome_data.genome_file,
                                      self.genome,
                                      self.update_progress)
        self.sql_builder.insert_data_source(downloader.get_url(),
                                            'Genome {}'.format(self.genome),
                                            'genelist',
                                            downloader.get_local_path())

    def insert_gene_list_files(self):
        for target in self.genome_data.ftp_files:
            data_file = GeneListDownloader(self.config.download_dir, GENE_LIST_HOST, target,
                                           self.genome, update_progress=self.update_progress)
            self.sql_builder.create_table_from_path(data_file.get_local_schema_path())
            self.sql_builder.copy_file_into_db(self.genome + '.' + data_file.get_root_filename(),
                                               data_file.get_extracted_path())
            self.sql_builder.insert_data_source(data_file.get_url(), data_file.get_description(),
                                                'genelist', data_file.get_local_path())
        for gene_list in self.genome_data.gene_lists:
            if gene_list.common_lookup_table:
                self.sql_builder.insert_genelist_with_lookup(gene_list)
            else:
                self.sql_builder.insert_genelist(gene_list)
        self.sql_builder.fill_gene_ranges(self.genome, self.config.binding_max_offset)

    def insert_prediction_files(self):
        self.sql_builder.begin_parallel()
        for prediction_setting in self.genome_data.prediction_lists:
            downloader = PredictionDownloader(self.config, prediction_setting, self.update_progress)
            filename = downloader.get_local_tsv_path()
            self.sql_builder.copy_file_into_db(self.genome_data.genomename + '.prediction', filename)
            self.sql_builder.insert_data_source(downloader.get_url(), downloader.get_description(),
                                                'prediction', filename)
        self.sql_builder.end_parallel()

    def create_gene_and_prediction_indexes(self):
        self.sql_builder.create_gene_and_prediction_indexes(self.genome)

    def create_gene_prediction(self):
        for prediction_setting in self.genome_data.prediction_lists:
            model_name = prediction_setting.name
            self.sql_builder.begin_parallel()
            self.sql_builder.insert_gene_prediction(self.genome, model_name)
            self.sql_builder.end_parallel()
        self.sql_builder.create_gene_prediction_indexes(self.genome)

    def delete_sql_for_gene_list_files(self):
        gene_lists = [gene_list_settings for gene_list_settings in self.genome_data.gene_lists]
        for gene_list in gene_lists:
            table_names = [gene_list.source_table]
            if gene_list.common_lookup_table:
                table_names.append(gene_list.common_lookup_table)
            self.sql_builder.delete_tables(gene_list.genome, table_names)


class SQLBuilder(object):
    """
    Builds up SQL based on templates and other commands against a database.
    """
    def __init__(self, template_directory):
        """
        :param template_directory: str path to directory containing the sql jinja2 templates.
        """
        self.env = Environment(loader=FileSystemLoader(template_directory))
        self.sql_pipeline = SQLPipeline()
        self.parallel_group = None

    def begin_parallel(self):
        self.parallel_group = SQLGroup()
        self.sql_pipeline.add(self.parallel_group)

    def end_parallel(self):
        self.parallel_group = None

    def add_sql(self, sql):
        if self.parallel_group:
            self.parallel_group.add(sql)
        else:
            sql_group = SQLGroup()
            sql_group.add(sql)
            self.sql_pipeline.add(sql_group)

    def add_parallel_sql(self, sql_list):
        sql_group = SQLGroup()
        for sql in sql_list:
            sql_group.add(sql)
        self.sql_pipeline.add(sql_group)

    def render_template(self, template_name, render_params):
        """
        Render sql for template_name, apply render_params.
        :param template_name: str name of SQL template file in template_directory
        :param render_params: dict key/values to use when rendering the template
        """
        template = self.env.get_template(template_name)
        return template.render(render_params) + "\n"

    def add_template(self, template_name, render_params):
        """
        Append sql to internal storage for template_name, apply render_params.
        :param template_name: str name of SQL template file in template_directory
        :param render_params: dict key/values to use when rendering the template
        """
        self.add_sql(self.render_template(template_name, render_params))

    def insert_gene_prediction(self, schema_prefix, model_name):
        for chrom in self.get_chromosomes():
            params = {
                'schema_prefix': schema_prefix,
                'chromosome': chrom,
                'model_name': model_name
            }
            self.add_template('insert_gene_prediction.sql', params)

    @staticmethod
    def get_chromosomes():
        chroms = []
        for i in range(22):
            chroms.append("chr{}".format(i+1))
        chroms.append("chrX")
        chroms.append("chrY")
        return chroms

    def create_gene_prediction_indexes(self, schema_prefix):
        self.add_template('create_gene_prediction_indexes.sql', {'schema_prefix': schema_prefix})

    def create_schema(self, schema_prefix, user_name):
        self.add_template('create_schema.sql', {'schema_prefix': schema_prefix, 'user_name': user_name})

    def create_base_tables(self, schema_prefix):
        self.add_template('create_base_tables.sql', {'schema_prefix': schema_prefix})

    def create_data_source(self):
        self.add_template('create_data_source.sql', {})

    def create_custom_list(self):
        self.add_template('create_custom_list.sql', {})

    def insert_data_source(self, url, description, data_source_type, filename):
        date = datetime.datetime.fromtimestamp(get_modified_time_for_filename(filename))
        downloaded = date.strftime("%Y-%m-%d %H:%M:%S)")
        self.add_template('insert_data_source.sql', {'url': url,
                                                     'description': description,
                                                     'data_source_type': data_source_type,
                                                     'downloaded': downloaded})

    def create_table_from_path(self, path):
        self.add_sql(sql_from_filename(path))

    def copy_file_into_db(self, destination, source_path):
        self.add_sql(CopyCommand(destination, source_path))

    def delete_tables(self, schema_prefix, tables):
        self.add_template('delete_tables.sql', {'schema_prefix':schema_prefix, 'delete_tables':tables})

    def fill_gene_ranges(self, schema_prefix, binding_max_offset):
        self.add_template('fill_gene_ranges.sql', {'schema_prefix': schema_prefix,
                                                       'binding_max_offset': binding_max_offset})

    def create_gene_and_prediction_indexes(self, schema_prefix):
        sql_list = [
            self.render_template('create_gene_index.sql', {'schema_prefix':schema_prefix}),
            self.render_template('create_prediction_index.sql', {'schema_prefix': schema_prefix})]
        self.add_parallel_sql(sql_list)

    def insert_genelist_with_lookup(self, gene_info):
        render_params = {
            'schema_prefix': gene_info.genome,
            'common_lookup_table': gene_info.common_lookup_table,
            'common_lookup_table_field': gene_info.common_lookup_table_field,
            'source_table': gene_info.source_table,
            'common_name': gene_info.common_name,
        }
        self.add_template('insert_genelist_with_lookup.sql', render_params)

    def insert_genelist(self, gene_info):
        render_params = {
            'schema_prefix': gene_info.genome,
            'source_table': gene_info.source_table,
            'common_name': gene_info.common_name,
        }
        self.add_template('insert_genelist.sql', render_params)


class SQLPipeline(object):
    """
    Represents a list of SQLGroups that must be run in order.
    """
    def __init__(self):
        self.groups = []

    def add(self, sql_group):
        """
        :param sql_group: SQLGroup: a group of sql statements tha can be run in parallel
        """
        self.groups.append(sql_group)

    def run(self, processor):
        for group in self.groups:
            group.run(processor)


class SQLGroup(object):
    """
    Represents some number of sql commands that can be run in parallel to each other.
    """
    def __init__(self):
        self.sql_commands = []

    def add(self, sql):
        """
        Add a new sql command to this list.
        :param sql: str: Complete sql command.
        """
        self.sql_commands.append(sql)

    def run(self, processor):
        processor(self.sql_commands)


class SqlRunner(object):
    def __init__(self, config, update_progress):
        self.db_config = config.dbconfig
        self.update_progress = update_progress
        self.db = create_connection(self.db_config)

    def execute(self, sql_commands):
        if len(sql_commands) == 1:
            self.db.execute(sql_commands[0])
        else:
            self.run_multiple(sql_commands)

    def run_multiple(self, sql_commands):
        pool = Pool()
        results = []
        for sql in sql_commands:
            results.append(pool.apply_async(execute_sql, (self.db_config, sql)))
        pool.close()
        pool.join()
        for result in results:
            if result.get():
                import time
                raise ValueError("SQL command failed:{}".format(result.get()))

    def close(self):
        self.db.close()


def create_connection(db_config):
    conn = PostgresConnection(db_config, print)
    conn.create_connection()
    return conn


def execute_sql(db_config, sql):
    try:
        db = create_connection(db_config)
        db.execute(sql)
        db.close()
    except Exception as err:
        return str(err)
    return ""