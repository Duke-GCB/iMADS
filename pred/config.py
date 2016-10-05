from yaml import load
import os

DEFAULT_DB_HOST = "localhost"
DEFAULT_DB_NAME = "pred"
DEFAULT_DB_USER = "pred_user"
DEFAULT_DB_PASS = "pred_pass"
DEFAULT_MAX_BINDING_OFFSET = 5000
DEFAULT_MAX_SORT_GUESS = 0.6

DB_HOST_ENV = "DB_HOST"
DB_NAME_ENV = "DB_NAME"
DB_USER_ENV = "DB_USER"
DB_PASS_ENV = "DB_PASS"

JOB_RUNNER_PASS_ENV = "JOB_RUNNER_PASS"

CONFIG_FILENAME = 'imadsconf.yaml'


class DataType(object):
    PREDICTION = 'PREDICTION'
    PREFERENCE = 'PREFERENCE'


def parse_config(filename):
    config = None
    with open(filename) as data_file:
        data = load(data_file)
        return parse_config_from_dict(data)


def parse_config_from_dict(data):
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
        self.model_tracks_url_list = data.get('model_tracks_url_list', [])
        self.model_base_url = data.get('model_base_url')
        self.download_dir = data['download_dir']
        self.genome_data_list = []
        self.dbconfig = dbconfig
        self.job_runner_password = os.environ.get(JOB_RUNNER_PASS_ENV, None)

    def add_genome(self, genome_data):
        self.genome_data_list.append(genome_data)

    def get_genomes_setup(self):
        result = {}
        for genome_data in self.genome_data_list:
            genome = genome_data.genomename
            model_data = [model.get_data() for model in genome_data.prediction_lists]
            gene_list_names = [gene_list.source_table for gene_list in genome_data.gene_lists]
            result[genome] = {
                'models': model_data,
                'geneLists': gene_list_names,
                'trackhubUrl': genome_data.trackhub_url,
                'genomeFile': genome_data.genome_file,
            }
        return result

    def get_max_sort_guess(self, genome, model_name):
        """
        Find the guess value for the max sort for a given model.
        :param genome: str: name of the genome ('hg19','hg38')
        :param model_name: str: name of the model ('E2F1...')
        :return: max value cutoff to speed up first few pages of searching
        """
        for genome_data in self.genome_data_list:
            if genome_data.genomename == genome:
                for model in genome_data.prediction_lists:
                    if model.name == model_name:
                        return model.sort_max_guess
        return DEFAULT_MAX_SORT_GUESS

    def get_all_model_names(self):
        """
        Return the unique names of all models across all genome versions
        :return:
        """
        result = set()
        for genome_data in self.genome_data_list:
            for model in genome_data.prediction_lists:
                result.add(model.name)
        return result


class GenomeData(object):
    def __init__(self, config, genome_data):
        self.download_dir = config.download_dir
        self.genomename = genome_data['genome']
        self.trackhub_url = genome_data['trackhub_url']
        self.genome_file = genome_data['genome_file']
        self.ftp_files = []
        self.gene_lists = []
        self.prediction_lists = []
        self._load_ftp_files(genome_data['ftp_files'])
        self._load_gene_lists(genome_data['gene_lists'])
        self._load_prediction_lists(genome_data['prediction_lists'])

    def _load_ftp_files(self, ftp_file_ary):
        for ftp_file in ftp_file_ary:
            self.ftp_files.append(ftp_file)

    def get_all_ftp_files(self):
        result = self.ftp_files
        result.append(self.genome_file)
        return result

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
            sort_max_guess = prediction_data['sort_max_guess']
            type = prediction_data.get('type', 'PREDICTION')
            preference_min = prediction_data.get('preference_min', None)
            preference_max = prediction_data.get('preference_max', None)
            core_offset = prediction_data.get('core_offset', None)
            core_length = prediction_data.get('core_length', None)
            family = prediction_data.get('family', None)
            prediction = PredictionSettings(name, url, self.genomename, fix_script, sort_max_guess, type,
                                            preference_min, preference_max, core_offset, core_length, family)
            self.prediction_lists.append(prediction)

    def get_model_types_str(self):
        return ','.join(["'{}'".format(data.name) for data in self.prediction_lists])


class GeneInfoSettings(object):
    def __init__(self, genome, name, source_table, common_name, common_lookup_table=None,
                 common_lookup_table_field=None):
        self.genome = genome
        self.name = name
        self.source_table = source_table
        self.common_name = common_name
        self.common_lookup_table = common_lookup_table
        self.common_lookup_table_field = common_lookup_table_field


class PredictionSettings(object):
    def __init__(self, name, url, genome, fix_script, sort_max_guess, data_type, preference_min, preference_max,
                 core_offset, core_length, family):
        self.name = name
        self.url = url
        self.genome = genome
        self.fix_script = fix_script
        self.sort_max_guess = sort_max_guess
        self.data_type = data_type
        self.preference_min = preference_min
        self.preference_max = preference_max
        self.core_offset = core_offset
        self.core_length = core_length
        self.family = family

    def get_data(self):
        """
        Creates a dictionary of data for sending out to client.
        :return: dict
        """
        return {
            'name': self.name,
            'data_type': self.data_type,
            'preference_min': self.preference_min,
            'preference_max': self.preference_max,
            'core_offset': self.core_offset,
            'core_length': self.core_length,
            'family': self.family
        }

