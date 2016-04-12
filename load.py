"""
Load gene list data and predictions into a Postgres database.
"""

from pred.config import parse_config, CONFIG_FILENAME
from pred.remotedata import PredictionDataInserter, GeneListDownloader
from pred.postgres import PostgresConnection
from jinja2 import FileSystemLoader, Environment

GENE_LIST_HOST = 'hgdownload.cse.ucsc.edu'
DOWNLOAD_CHUNK_SIZE = 16 * 1024
SQL_TEMPLATE_DIR = 'sql_templates'


def update_progress(message):
    """
    :param message: str message to print out
    """
    print(message)


class TemplateExecutor(object):
    """
    Executes sql templates and other commands against a database.
    """
    def __init__(self, db, template_directory):
        """
        :param db: PostgresConnection database we will update.
        :param template_directory: str path to directory containing the sql jinja2 templates.
        """
        self.db = db
        self.env = Environment(loader=FileSystemLoader(template_directory))

    def execute_template(self, template_name, render_params, exec_params=()):
        """
        Create a template for template_name, apply render_params, and run against database with exec_params.
        :param template_name: str name of SQL template file in template_directory
        :param render_params: dict key/values to use when rendering the template
        :param exec_params: dict key/values to use when executing the rendered template
        """
        template = self.env.get_template(template_name)
        sql = template.render(render_params)
        self.db.execute(sql, exec_params)

    def create_gene_prediction(self, schema_prefix):
        self.execute_template('create_gene_prediction.sql', {'schema_prefix': schema_prefix})

    def create_schema(self, schema_prefix, user_name):
        self.execute_template('create_schema.sql', {'schema_prefix': schema_prefix, 'user_name': user_name})

    def create_base_tables(self, schema_prefix):
        self.execute_template('create_base_tables.sql', {'schema_prefix': schema_prefix})

    def create_data_source(self):
        self.execute_template('create_data_source.sql', {})

    def insert_data_source(self, url, description, data_source_type):
        self.execute_template('insert_data_source.sql', {}, exec_params=(url, description, data_source_type))

    def create_table_from_path(self, path):
        self.db.create_table(path)

    def copy_file_into_db(self, destination, source_path):
        self.db.copy_file_into_db(destination, source_path)

    def delete_tables(self, schema_prefix, tables):
        self.execute_template('delete_tables.sql', {'schema_prefix':schema_prefix, 'delete_tables':tables})

    def fill_gene_ranges(self, schema_prefix, binding_max_offset):
        self.execute_template('fill_gene_ranges.sql', {'schema_prefix': schema_prefix},
                                 exec_params=(binding_max_offset, binding_max_offset,
                                              binding_max_offset, binding_max_offset))

    def create_indexes_if_necessary(self, schema_prefix):
        self.execute_template('create_indexes_if_necessary.sql', {'schema_prefix':schema_prefix})

    def insert_genelist_with_lookup(self, gene_info):
        render_params = {
            'schema_prefix': gene_info.genome,
            'common_lookup_table': gene_info.common_lookup_table,
            'common_lookup_table_field': gene_info.common_lookup_table_field,
            'source_table': gene_info.source_table,
            'common_name': gene_info.common_name,
        }
        self.execute_template('insert_genelist_with_lookup.sql', render_params)

    def insert_genelist(self, gene_info):
        render_params = {
            'schema_prefix': gene_info.genome,
            'source_table': gene_info.source_table,
            'common_name': gene_info.common_name,
        }
        self.execute_template('insert_genelist.sql', render_params)


def download_gene_list_files(executor, download_dir, genome, file_list):
    for target in file_list:
        data_file = GeneListDownloader(download_dir, GENE_LIST_HOST, target, genome, update_progress=update_progress)
        data_file.download_and_extract()
        data_file.download_schema_and_convert()
        executor.create_table_from_path(data_file.get_local_schema_path())
        executor.copy_file_into_db(genome + '.' + data_file.get_root_filename(), data_file.get_extracted_path())
        executor.insert_data_source(data_file.get_url(), data_file.get_description(), 'genelist')


class GeneInfo(object):
    def __init__(self, gene_info_settings):
        self.genome = gene_info_settings.genome
        self.source_table = gene_info_settings.source_table
        self.common_name = gene_info_settings.common_name
        self.common_lookup_table = gene_info_settings.common_lookup_table
        self.common_lookup_table_field = gene_info_settings.common_lookup_table_field


def load_gene_table(executor, gene_lists):
    for gene_list in gene_lists:
        if gene_list.common_lookup_table:
            executor.insert_genelist_with_lookup(gene_list)
        else:
            executor.insert_genelist(gene_list)


def delete_gene_tables(executor, gene_lists):
    for gene_list in gene_lists:
        table_names = [gene_list.source_table]
        if gene_list.common_lookup_table:
            table_names.append(gene_list.common_lookup_table)
        executor.delete_tables(gene_list.genome, table_names)


def load_prediction_table(executor, prediction_models):
    for prediction_data_source in prediction_models:
        prediction_data_source.create(executor.db)
        executor.insert_data_source(prediction_data_source.get_url(), prediction_data_source.get_description(),
                                    'prediction')


def download_and_convert_predictions(prediction_models):
    for prediction_model in prediction_models:
        prediction_model.download_and_convert()


def load_database_based_on_config(config):
    dbconfig = config.dbconfig
    db = PostgresConnection(dbconfig.host, dbconfig.dbname, dbconfig.user, dbconfig.password, update_progress=update_progress)
    executor = TemplateExecutor(db, SQL_TEMPLATE_DIR)
    executor.create_data_source()
    for genome_data in config.genome_data_list:
        genome = genome_data.genomename
        executor.create_schema(genome, dbconfig.user)
        executor.create_base_tables(genome)

        gene_lists = [GeneInfo(gene_list_settings) for gene_list_settings in genome_data.gene_lists]
        prediction_lists = [PredictionDataInserter(prediction_setting, update_progress=update_progress)
                            for prediction_setting in genome_data.prediction_lists]

        download_gene_list_files(executor, config.download_dir, genome, genome_data.ftp_files)
        load_gene_table(executor, gene_lists)
        executor.fill_gene_ranges(genome, config.binding_max_offset)

        download_and_convert_predictions(prediction_lists)
        load_prediction_table(executor, prediction_lists)
        executor.create_indexes_if_necessary(genome)
        executor.create_gene_prediction(genome)
        delete_gene_tables(executor, gene_lists)


if __name__ == '__main__':
    load_database_based_on_config(parse_config(CONFIG_FILENAME))