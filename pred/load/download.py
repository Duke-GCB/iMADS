"""
Downloads and converts files to various formats.
"""
import os
import re
from ftplib import FTP
import gzip
from urlparse import urlparse
import requests
import subprocess
import yaml

GENE_LIST_HOST = 'hgdownload.cse.ucsc.edu'
DOWNLOAD_URL_CHUNK_SIZE = 16 * 1024


def download_and_convert(config, update_progress):
    """
    For each version of the genome in config download and convert genome, gene lists, and prediction files.
    :param config: Config: global configuration settings
    :param update_progress: func(str): called with messages related to progress
    """
    for genome_data in config.genome_data_list:
        genome_files = GenomeFiles(config, genome_data, update_progress)
        genome_files.download_genome()
        genome_files.download_gene_list_files()
        genome_files.download_prediction_files()
        genome_files.download_alias_files()
    download_models(config, update_progress)


def download_models(config, update_progress):
    """
    Download models to config.download_dir based on config.model_tracks_url
    :param config: Config: global configuration settings
    :param update_progress: func(str): called with messages related to progress
    :return:
    """
    model_files = ModelFiles(config)
    for model_tracks_url in config.model_tracks_url_list:
        local_tracks_filename = model_files.get_local_path_for_url(model_tracks_url)
        download_url(model_tracks_url, local_tracks_filename, update_progress)

    for details in model_files.get_model_details():
        url = details['url']
        local_path = details['local_path']
        download_url(url, local_path, update_progress)


def download_url(url, local_path, update_progress):
    """
    Download a remote file into a local path optionally printing progress out.
    :param url: str: url we should download
    :param local_path: str: where we should download the file to
    :param update_progress: func(str): called with messages related to progress
    :return:
    """
    update_progress('Downloading: {}'.format(url))
    r = requests.get(url, stream=True)
    with open(local_path, 'wb') as f:
        for chunk in r.iter_content(chunk_size=DOWNLOAD_URL_CHUNK_SIZE):
            if chunk:  # filter out keep-alive new chunks
                f.write(chunk)


class ModelFiles(object):
    """
    Retrieves data related to models used in the predictions specified in config.
    """
    def __init__(self, config):
        """
        Setup with config specifying where to get and store model files and tracks.yml.
        :param config: Config: settings used to retrieve model info
        """
        self.model_base_url = config.model_base_url
        self.model_tracks_url_list = config.model_tracks_url_list
        self.models_dir = '{}/models'.format(config.download_dir)
        self.model_names = config.get_all_model_names()

    def get_local_path_for_url(self, url):
        """
        Given a url return a local path for storing the data.
        :param url: str: url we will download
        :return: str: path where to store the file
        """
        filename = os.path.basename(url)
        return '{}/{}'.format(self.models_dir, filename)

    def get_model_track_name(self, url):
        """
        Given a url return a user facing name for the file stripping un-necessary parts.
        :param url: str: url we will download
        :return: str: name to show to the user
        """
        filename = os.path.basename(url).replace("tracks-","").replace(".yaml","")
        return 'Model settings for {}'.format(filename)

    def get_model_details(self):
        """
        Returns unique properties from YAML downloaded from model_tracks_url passed in config.
        Only includes the model filenames that we have predictions for.
        :return: [dict] list of dicts of model properties
        """
        data = []
        unique_filenames = set()
        for item in self._get_tracks_data():
            track_name = item['track_name']
            filenames = item.get('model_filenames', [])
            if track_name in self.model_names:
                for i in range(len(filenames)):
                    filename = filenames[i]
                    core = item['cores'][i]
                    if not filename in unique_filenames:
                        details = self._make_details(filename, core, item)
                        data.append(details)
                        unique_filenames.add(filename)
        return data

    def _make_details(self, filename, core, item):
        """
        Make a dictionary of end user fields for a filename,core,item
        :param filename: str: filename user can download
        :param core: str: core that this model file is for
        :param item: str: dict: properties from trackhub yaml
        :return: dict: properties describing this model
        """
        group_name = 'Protein {}'.format(item['protein'])
        description = 'Model for core {}'.format(core)
        return {
            'filename': filename,
            'group_name': group_name,
            'description': description,
            'url': self.get_model_url(filename),
            'local_path': self.get_local_path(filename),
        }

    def _get_tracks_data(self):
        """
        Returns YAML data based on model_tracks_url property
        :return: object: array of model info
        """
        result = []
        for tracks_url in self.model_tracks_url_list:
            resp = requests.get(tracks_url)
            resp.raise_for_status()
            result.extend(yaml.safe_load(resp.text))
        return result

    def get_model_url(self, filename):
        """
        Transform a model filename from get_model_filenames into a url we can download.
        :param filename: filename base for url
        :return: str: url to download model
        """
        return '{}/{}'.format(self.model_base_url, filename)

    def get_local_path(self, filename):
        """
        Transform a model filename from get_model_filenames into a local path.
        :param filename: filename base for path
        :return: str: path to where the model file should live
        """
        return '{}/{}'.format(self.models_dir, filename)


class GenomeFiles(object):
    """
    Provides functions for downloading and converting files for a version of genome specified via genome_data.
    """
    def __init__(self, config, genome_data, update_progress):
        """
        Setup for downloading/converting.
        :param config: Config: global configuration settings
        :param genome_data: dict: settings for a particular version of the genome
        :param update_progress: func(str): called with messages related to progress
        """
        self.config = config
        self.genome_data = genome_data
        self.update_progress = update_progress

    def download_genome(self):
        """
        Download a genome 2bit file.
        """
        downloader = GenomeDownloader(self.config, GENE_LIST_HOST,
                                      self.genome_data.genome_file, self.genome_data.genomename,
                                      update_progress=self.update_progress)
        downloader.download()

    def download_gene_list_files(self):
        """
        Downloads and converts files related to gene lists specified in genome_data.
        """
        for target in self.genome_data.ftp_files:
            data_file = GeneListDownloader(self.config, GENE_LIST_HOST, target,
                                           self.genome_data.genomename, update_progress=self.update_progress)
            data_file.download_and_extract()
            data_file.download_schema_and_convert()

    def download_prediction_files(self):
        """
        Downloads and converts prediction files for one version of the genome specified in genome_data.
        """
        for prediction_setting in self.genome_data.prediction_lists:
            downloader = PredictionDownloader(self.config, prediction_setting, update_progress=self.update_progress)
            downloader.download_and_convert()

    def download_alias_files(self):
        """
        Download the gene name alias url file if we have one.
        """
        url = self.genome_data.alias_url
        if url:
            alias_file = GeneSymbolAliasFile(self.config, self.genome_data)
            alias_file.download()


class MySQLtoPG(object):
    """
    Converts MYSQL schema into a Postgres compatible one.
    Written specifically for UCSC MySQL schemas.
    """
    def __init__(self, schema_path, genome):
        self.schema_path = schema_path
        self.genome = genome

    def convert(self):
        """
        Converts schema_path from mysql to postgres format.
        :return:
        """
        converted_schema = ''
        with open(self.schema_path, 'r') as infile:
            for line in infile.readlines():
                if MySQLtoPG.include(line):
                    converted_schema += self.format(line)
        with open(self.schema_path, 'w') as outfile:
            outfile.write(converted_schema.replace(',\n) ;', '\n);'))

    @staticmethod
    def include(line):
        """
        Do we need to convert this line when converting the schema.
        :param line: str: line from mysql schema file.
        :return: bool: true if we need to include it
        """
        if line.startswith("--") or line.startswith('/*') or len(line.strip()) == 0 \
                or line.startswith("DROP") or line.startswith('  KEY'):
            return False
        return True

    def format(self, line):
        """
        Replace mysql data with postgres equivalents.
        :param line: str: line from mysql schema to convert to postgres format
        :return: str: formatted line
        """
        line = line.replace('`', '')
        line = line.replace('longblob', 'bytea')
        line = line.replace('ENGINE=MyISAM DEFAULT CHARSET=latin1', '')
        line = line.replace('int(10) unsigned', 'bigint')
        line = line.replace('int(11)', 'bigint')
        line = line.replace('smallint(5) unsigned', 'int')
        line = line.replace('CREATE TABLE ', 'CREATE TABLE ' + self.genome + '.')
        line = re.sub('enum\(.*\)', 'varchar', line)
        return line


class FTPUtil(object):
    """
    Simplifies using FTP module to download files one at a time.
    """
    def __init__(self, config):
        """
        Setup the util with config so it knows the directory we will download files into.
        :param config: pred.Config: contains download directory
        """
        self.config = config

    def download_ftp_url(self, url, dest_sub_directory):
        """
        Download the file referenced by the ftp url into dest_sub_directory without our download directory.
        :param url: str: ftp url to a file we want to download
        :param dest_sub_directory: str: subdirectory where we will save the file locally
        """
        url_details = urlparse(url)
        if url_details.scheme != 'ftp':
            raise ValueError("Unsupported scheme {}".format(url_details.scheme))
        ftp_host = url_details.netloc
        ftp_dir = os.path.dirname(url_details.path)
        ftp_filename = os.path.basename(url_details.path)
        self.download_ftp(ftp_host, ftp_dir, ftp_filename, dest_sub_directory)

    def download_ftp(self, ftp_host, ftp_dir, ftp_filename, dest_sub_directory):
        """
        Download the file referenced by the ftp params into dest_sub_directory without our download directory.
        Will create the sub directory if it doesn't exist.
        :param ftp_host: str: host we will connect to
        :param ftp_dir: str: directory we will cd into
        :param ftp_filename: str: name of the file to download
        :param dest_sub_directory: subdirectory where we will save the file locally
        """
        dest_dir = os.path.join(self.config.download_dir, dest_sub_directory)
        if not os.path.exists(dest_dir):
            os.mkdir(dest_dir)
        dest_path = '{}/{}'.format(dest_dir, ftp_filename)
        ftp = FTP(ftp_host, 'anonymous', 'gcb-contact@duke.edu')
        ftp.cwd(ftp_dir)
        with open(dest_path, 'wb') as outfile:
            ftp.retrbinary("RETR " + ftp_filename, outfile.write)
        ftp.close()



class GenomeDownloader(object):
    """
    Retrieves 2bit genome file from via FTP.
    """
    def __init__(self, config, ftp_host, ftp_path, genome, update_progress):
        self.ftp_util = FTPUtil(config)
        self.local_dir = os.path.join(config.download_dir, genome)
        self.ftp_host = ftp_host
        self.ftp_path = ftp_path
        self.genome = genome
        self.update_progress = update_progress

    def download(self):
        """
        Download 2bit file via ftp.
        """
        self._download_file(self.get_ftp_filename(), self.get_local_path())

    def _download_file(self, filename, out_filename):
        """
        Download the specified file via ftp.
        :param filename: str: filename we should download via FTP
        :param out_filename: str: path where we should write the 2bit file.
        """
        self.update_progress('Downloading: ' + filename)
        self.ftp_util.download_ftp(self.ftp_host, self.get_ftp_dir(), filename, self.genome)

    def get_ftp_dir(self):
        return os.path.dirname(self.ftp_path)

    def get_ftp_filename(self):
        return os.path.basename(self.ftp_path)

    def get_local_path(self):
        return os.path.join(self.local_dir, self.get_ftp_filename())

    def get_url(self):
        """
        Returns URL for documenting where the user can find this file via a browser.
        :return: URL equivalent for ftp file(UCSC keeps these in equivalent locations).
        """
        return "{}/{}".format(self.ftp_host, self.ftp_path)


class GeneListDownloader(object):
    """
    Fetches and converts a *.txt.gz file and accompanying *.sql(schema) from ftp server.
    """
    def __init__(self, config, ftp_host, ftp_path, genome, update_progress):
        self.ftp_util = FTPUtil(config)
        self.local_dir = os.path.join(config.download_dir, genome)
        self.ftp_host = ftp_host
        self.ftp_path = ftp_path
        self.genome = genome
        self.update_progress = update_progress

    def get_description(self):
        """
        Return user description for this file.
        """
        return "UCSC {} {}".format(self.genome, self.get_ftp_filename().replace(".txt.gz",""))

    def get_ftp_dir(self):
        return os.path.dirname(self.ftp_path)

    def get_ftp_filename(self):
        return os.path.basename(self.ftp_path)

    def get_local_path(self):
        return os.path.join(self.local_dir, self.get_ftp_filename())

    def get_root_filename(self):
        return re.sub(r".txt.gz$", "", self.get_ftp_filename())

    def get_ftp_schema_filename(self):
        return re.sub(r".txt.gz$", ".sql", self.get_ftp_filename())

    def get_local_schema_path(self):
        return os.path.join(self.local_dir, self.get_ftp_schema_filename())

    def get_extracted_path(self):
        extracted_filename = re.sub(r".txt.gz$", ".txt", self.get_ftp_filename())
        return os.path.join(self.local_dir, extracted_filename)

    def download_and_extract(self):
        self.update_progress('Downloading: ' + self.get_local_path())
        if not os.path.exists(self.local_dir):
            os.mkdir(self.local_dir)
        self._download_file(self.get_ftp_filename())
        self.update_progress('Extracting: ' + self.get_local_path())
        self._extract()

    def _extract(self):
        local_path = self.get_local_path()
        dest_filename = self.get_extracted_path()
        with gzip.open(local_path, 'rb') as infile:
            with open(dest_filename, 'wb') as outfile:
                outfile.write(infile.read())

    def download_schema_and_convert(self):
        self.update_progress('Downloading: ' + self.get_ftp_schema_filename())
        self._download_file(self.get_ftp_schema_filename())
        self.update_progress('Fixing: ' + self.get_ftp_schema_filename())
        mysql_to_pg = MySQLtoPG(self.get_local_schema_path(), self.genome)
        mysql_to_pg.convert()

    def _download_file(self, filename):
        self.ftp_util.download_ftp(self.ftp_host, self.get_ftp_dir(), filename, self.genome)

    def get_url(self):
        """
        Returns URL for documenting where the user can find this file via a browser.
        :return: URL equivalent for ftp file(UCSC keeps these in equivalent locations).
        """
        return "{}/{}".format(self.ftp_host, self.ftp_path)


class PredictionDownloader(object):
    """
    Download a prediction file and convert into tsv format.
    """
    def __init__(self, config, prediction_settings, update_progress):
        """
        Setup to download the prediction file specified in prediction settings.
        :param config: pred.Config: global settings
        :param prediction_settings: object: details from config file for this prediction
        :param update_progress: func(str): called with messages related to progress
        """
        self.local_dir = config.download_dir
        self.name = prediction_settings.name
        self.url = prediction_settings.url
        self.genome = prediction_settings.genome
        self.update_progress = update_progress
        self.fix_script = prediction_settings.fix_script
        if not os.path.exists(self.local_dir):
            os.mkdir(self.local_dir)

    def get_url(self):
        return self.url

    def get_description(self):
        """
        Returns user description of this file.
        """
        return "Prediction {} {}".format(self.genome, self.name)

    def get_url_filename(self):
        return os.path.basename(self.url)

    def get_url_filename(self):
        return os.path.basename(self.url)

    def get_local_bigbed_path(self):
        return os.path.join(self.local_dir, self.genome, self.get_url_filename())

    def get_local_bed_path(self):
        pre, ext = os.path.splitext(self.get_url_filename())
        bed_filename = pre + '.bed'
        return os.path.join(self.local_dir, self.genome, bed_filename)

    def get_local_tsv_path(self):
        pre, ext = os.path.splitext(self.get_url_filename())
        bed_filename = pre + '.tsv'
        return os.path.join(self.local_dir, self.genome, bed_filename)

    def download_and_convert(self):
        """
        Downloads bigbed file and converts to tsv.
        :return:
        """
        local_filename = self.get_local_bigbed_path()
        download_url(self.url, local_filename, self.update_progress)
        self.update_progress('Converting: ' + local_filename)
        ret = subprocess.call([self.fix_script, local_filename, self.get_local_bed_path()])
        if ret != 0:
            raise ValueError("Failed to convert dat a file:" + str(ret))
        self.create_tsv()

    def create_tsv(self):
        """
        Create tab separated file from bed file.
        """
        self.update_progress('Converting data source: ' + self.get_local_bed_path())
        temp_path = self.get_local_tsv_path()
        with open(self.get_local_bed_path(), 'r') as bedfile:
            with open(temp_path, 'w') as outfile:
                self.convert_tsv_data(bedfile, outfile)
                while True:
                    line = bedfile.readline()
                    if line:
                        parts = line.split('\t')
                        included_values = parts[:4]
                        (chorm, start_range, end_range, value) = included_values
                        result_values = [chorm, start_range, end_range, value, self.name, "[{},{}]".format(start_range, end_range)]
                        outfile.write('\t'.join(result_values) + '\n')
                    else:
                        break

    def convert_tsv_data(self, bed_file, outfile):
        """
        Convert lines from bed_file into tsv and write to outfile.
        :param bed_file: filehandle: we read lines from this file
        :param outfile: filehandle: we write lines to this file
        """
        while True:
            line = bed_file.readline()
            if line:
                parts = line.split('\t')
                included_values = parts[:4]
                (chrom, start_range, end_range, value) = included_values
                result_values = [chrom, start_range, end_range, value, self.name,
                                 "[{},{}]".format(start_range, end_range)]
                outfile.write('\t'.join(result_values) + '\n')
            else:
                break


class GeneSymbolAliasFile(object):
    SYMBOL_FIELDNAME = 'symbol'
    ALIAS_FIELDNAME = 'alias_symbol'
    """
    A file we can download via ftp that contains gene alias information.
    """
    def __init__(self, config, genome_data):
        self.config = config
        self.local_sub_directory = genome_data.genomename
        self.url = genome_data.alias_url
        self.cnt = 0

    def download(self):
        ftp_util = FTPUtil(self.config)
        ftp_util.download_ftp_url(self.url, self.local_sub_directory)
        self.save_symbol_alias_pairs()

    @staticmethod
    def split_alias_list(alias_list):
        no_quotes = alias_list.replace('"', '')
        return no_quotes.split("|")

    def get_local_tsv_path(self):
        pre, ext = os.path.splitext(self.get_local_filename())
        return pre + '.tsv'

    def save_symbol_alias_pairs(self):
        with open(self.get_local_tsv_path(), 'w') as outfile:
            for symbol, alias in self.get_symbol_alias_pairs():
                outfile.write("{}\t{}\n".format(symbol, alias))

    def get_symbol_alias_pairs(self):
        symbol_idx = alias_idx = -1
        first_time = True
        gene_symbol_lookup = GeneSymbolAliasLookup()
        with open(self.get_local_filename()) as infile:
            for line in infile:
                parts = line.split("\t")
                if first_time:
                    symbol_idx, alias_idx = self.get_indexes(parts)
                    first_time = False
                else:
                    symbol_value = parts[symbol_idx]
                    alias_value = parts[alias_idx]
                    if alias_value:
                        alias_list = GeneSymbolAliasFile.split_alias_list(alias_value)
                        for alias_name in alias_list:
                            gene_symbol_lookup.add(symbol_value, alias_name)
        return gene_symbol_lookup.get_pairs()

    def get_indexes(self, parts):
        symbol_idx = -1
        alias_idx = -1
        for idx, key in enumerate(parts):
            if key == GeneSymbolAliasFile.SYMBOL_FIELDNAME:
                symbol_idx = idx
            if key == GeneSymbolAliasFile.ALIAS_FIELDNAME:
                alias_idx = idx

        if symbol_idx == -1 or alias_idx == -1:
            raise ValueError("Missing symbol or alias fieldnames in data file.")
        return symbol_idx, alias_idx

    def get_local_filename(self):
        base_dir = self.config.download_dir
        sub_dir = self.local_sub_directory
        filename = os.path.basename(self.url)
        return '{}/{}/{}'.format(base_dir, sub_dir, filename)


class GeneSymbolAliasLookup(object):
    def __init__(self):
        self.lookup = {}

    def add(self, from_name, to_name):
        self._add(from_name, to_name)
        self._add(to_name, from_name)

    def _add(self, from_name, to_name):
        alias_list = self.lookup.get(from_name, None)
        if not alias_list:
            alias_list = set()
            self.lookup[from_name] = alias_list
        alias_list.add(to_name)

    def get_pairs(self):
        pairs = []
        for key in self.lookup:
            values = self.lookup[key]
            for value in values:
                pairs.append((key, value))
        return pairs
