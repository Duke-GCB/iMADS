from yaml import load
import os

DEFAULT_DB_HOST = "localhost"
DEFAULT_DB_NAME = "pred"
DEFAULT_DB_USER = "pred_user"
DEFAULT_DB_PASS = "pred_pass"
DEFAULT_MAX_BINDING_OFFSET = 5000

DB_HOST_ENV = "DB_HOST"
DB_NAME_ENV = "DB_NAME"
DB_USER_ENV = "DB_USER"
DB_PASS_ENV = "DB_PASS"

CONFIG_FILENAME = 'predictionsconf.yaml'


def parse_config(filename):
    config = None
    with open(filename) as data_file:
        data = load(data_file)
        dbconfig = DBConfig()
        config = Config(data, dbconfig)
        genome_data_ary = data['genome_data']
        for genome_data in genome_data_ary:
            config.add_genome(GenomeData(config, genome_data))
    return config


class DBConfig(object):
    def __init__(self):
        self.host = os.environ.get(DB_HOST_ENV, DEFAULT_DB_HOST)
        self.dbname = os.environ.get(DB_NAME_ENV, DEFAULT_DB_NAME)
        self.user = os.environ.get(DB_USER_ENV, DEFAULT_DB_USER)
        self.password = os.environ.get(DB_PASS_ENV, DEFAULT_DB_PASS)


class Config(object):
    def __init__(self, data, dbconfig):
        self.binding_max_offset = data.get('binding_max_offset', DEFAULT_MAX_BINDING_OFFSET)
        self.download_dir = data['download_dir']
        self.genome_data_list = []
        self.dbconfig = dbconfig

    def add_genome(self, genome_data):
        self.genome_data_list.append(genome_data)

    def get_genomes_setup(self):
        result = {}
        for genome_data in self.genome_data_list:
            genome = genome_data.genomename
            model_names = [model.name for model in genome_data.prediction_lists]
            gene_list_names = [gene_list.source_table for gene_list in genome_data.gene_lists]
            result[genome] = {
                'models': model_names,
                'gene_lists': gene_list_names,
                'trackhub_url': genome_data.trackhub_url

            }
        return result


class GenomeData(object):
    def __init__(self, config, genome_data):
        self.download_dir = config.download_dir
        self.genomename = genome_data['genome']
        self.trackhub_url = genome_data['trackhub_url']
        self.ftp_files = []
        self.gene_lists = []
        self.prediction_lists = []
        self._load_ftp_files(genome_data['ftp_files'])
        self._load_gene_lists(genome_data['gene_lists'])
        self._load_prediction_lists(genome_data['prediction_lists'])

    def _load_ftp_files(self, ftp_file_ary):
        for ftp_file in ftp_file_ary:
            self.ftp_files.append(ftp_file)

    def _load_gene_lists(self, genome_data_ary):
        for gene_list in genome_data_ary:
            name = gene_list["name"]
            source_table = gene_list["source_table"]
            common_name = gene_list["common_name"]
            common_lookup_table = gene_list.get("common_lookup_table", None)
            common_lookup_table_field = gene_list.get("common_lookup_table_field", None)
            gene_info = GeneInfoSettings(self.genomename, name, source_table, common_name,
                                 common_lookup_table, common_lookup_table_field)
            self.gene_lists.append(gene_info)

    def _load_prediction_lists(self, prediction_data_ary):
        for prediction_data in prediction_data_ary:
            name = prediction_data['name']
            url = prediction_data['url']
            fix_script = prediction_data['fix_script']
            prediction = PredictionSettings(name, self.download_dir, url, self.genomename,
                                            fix_script)
            self.prediction_lists.append(prediction)


class GeneInfoSettings(object):
    def __init__(self, genome, name, source_table, common_name, common_lookup_table=None, common_lookup_table_field=None):
        self.genome = genome
        self.name = name
        self.source_table = source_table
        self.common_name = common_name
        self.common_lookup_table = common_lookup_table
        self.common_lookup_table_field = common_lookup_table_field


class PredictionSettings(object):
    def __init__(self, name, local_dir, url, genome, fix_script):
        self.name = name
        self.local_dir = local_dir
        self.url = url
        self.genome = genome
        self.fix_script = fix_script

