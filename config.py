from yaml import load

DEFAULT_DB_HOST = "localhost"
DEFAULT_DB_NAME = "pred"
DEFAULT_DB_USER = "pred_user"
DEFAULT_DB_PASS = "pred_pass"
DEFAULT_MAX_BINDING_OFFSET = 5000

CONFIG_FILENAME = 'predictionsconf.yaml'

def parse_config(filename):
    config = None
    with open(filename) as data_file:
        data = load(data_file)
        dbconfig = DBConfig(data.get('db', {}))
        config = Config(data, dbconfig)
        genome_data_ary = data['genome_data']
        for genome_data in genome_data_ary:
            config.add_genome(GenomeData(config, genome_data))
    return config


class DBConfig(object):
    def __init__(self, json_db):
        self.host = json_db.get('host', DEFAULT_DB_HOST)
        self.dbname = json_db.get('dbname', DEFAULT_DB_NAME)
        self.user = json_db.get('user', DEFAULT_DB_USER)
        self.password = json_db.get('password', DEFAULT_DB_PASS)


class Config(object):
    def __init__(self, data, dbconfig):
        self.binding_max_offset = data.get('binding_max_offset', DEFAULT_MAX_BINDING_OFFSET)
        self.download_dir = data['download_dir']
        self.genome_data_list = []
        self.dbconfig = dbconfig

    def add_genome(self, genome_data):
        self.genome_data_list.append(genome_data)


class GenomeData(object):
    def __init__(self, config, genome_data):
        self.download_dir = config.download_dir
        self.genomename = genome_data['genome']
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

"""
g_binding_max_offset = 5000
g_download_dir = '/tmp/ucscjpb'
g_psql = PGCmdLine('pred', 'pred_user', 'pred_pass')

g_genome = 'hg38'
g_file_list = [
    'goldenPath/hg38/database/wgEncodeGencodeBasicV23.txt.gz',
    'goldenPath/hg38/database/wgEncodeGencodeCompV23.txt.gz',
    'goldenPath/hg38/database/knownGene.txt.gz',
    'goldenPath/hg38/database/kgXref.txt.gz',
    'goldenPath/hg38/database/refGene.txt.gz',
]
g_gene_lists = [
    GeneInfo(g_genome, 'knowngene', 'genesymbol', common_lookup_table='kgxref', common_lookup_table_field='kgid'),
    GeneInfo(g_genome, 'refgene', 'name2'),
    GeneInfo(g_genome, 'wgEncodeGencodeBasicV23', 'name2'),
    GeneInfo(g_genome, 'wgEncodeGencodeCompV23', 'name2'),
]
E2F1 = PredictionDataSource('E2F1',
                            g_download_dir,
                            'http://trackhub.genome.duke.edu/tf-dna-binding-predictions/hg38/E2F1-hg38_binding_site_start.bw',
                            g_genome)

E2F4 = PredictionDataSource('E2F4',
                            g_download_dir,
                            'http://trackhub.genome.duke.edu/tf-dna-binding-predictions/hg38/E2F4-hg38_binding_site_start.bw',
                            g_genome)
g_prediction_models = [E2F1, E2F4]
"""