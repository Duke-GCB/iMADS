import re
import subprocess
import tempfile
import gzip
import os
import requests
from ftplib import FTP


class PredictionDataInserter(object):
    def __init__(self, prediction_settings, update_progress):
        self.name = prediction_settings.name
        self.local_dir = prediction_settings.local_dir
        self.url = prediction_settings.url
        self.genome = prediction_settings.genome
        self.update_progress = update_progress
        self.fix_script = prediction_settings.fix_script
        if not os.path.exists(self.local_dir):
            os.mkdir(self.local_dir)

    def get_url(self):
        return self.url

    def get_description(self):
        return "Prediction {} {}".format(self.genome, self.name)

    def get_url_filename(self):
        return os.path.basename(self.url)

    def get_url_filename(self):
        return os.path.basename(self.url)

    def get_local_bigwig_path(self):
        return os.path.join(self.local_dir, self.genome, self.get_url_filename())

    def get_local_bed_path(self):
        pre, ext = os.path.splitext(self.get_url_filename())
        bed_filename = pre + '.bed'
        return os.path.join(self.local_dir, self.genome, bed_filename)

    def download_and_convert(self):
        local_filename = self.get_local_bigwig_path()
        self.update_progress('Downloading: ' + self.url)
        r = requests.get(self.url, stream=True)
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024):
                if chunk: # filter out keep-alive new chunks
                    f.write(chunk)
        self.update_progress('Converting: ' + local_filename)
        ret = subprocess.call([self.fix_script, local_filename, self.get_local_bed_path()])
        if ret != 0:
            raise ValueError("Failed to convert dat a file:" + str(ret))

    def create(self, db):
        self.update_progress('Loading data source: ' + self.get_local_bed_path())
        fd, temp_path = tempfile.mkstemp()
        with open(self.get_local_bed_path(), 'r') as bedfile:
            with open(temp_path, 'w') as outfile:
                while True:
                    line = bedfile.readline()
                    if line:
                        parts = line.split('\t')
                        included_values = parts[:4]
                        included_values.append(self.name)
                        outfile.write('\t'.join(included_values) + '\n')
                    else:
                        break
        os.close(fd)
        db.copy_file_into_db(self.genome + '.prediction', temp_path,
                               columns=('chrom', 'start_range', 'end_range', 'value', 'model_name'))
        os.remove(temp_path)
        update_sql = 'update {}.prediction set range = int4range(start_range, end_range) where range is null'
        fix_range_sql = update_sql.format(self.genome)
        db.execute(fix_range_sql, None)


class GeneListDownloader(object):
    """
    Represents a *.txt.gz file and accompanying *.sql(schema) we can download from UCSC.
    """
    def __init__(self, local_dir, ftp_host, ftp_path, genome, update_progress):
        self.local_dir = os.path.join(local_dir, genome)
        self.ftp_host = ftp_host
        self.ftp_path = ftp_path
        self.genome = genome
        self.update_progress = update_progress
        if not os.path.exists(self.local_dir):
            os.mkdir(self.local_dir)

    def get_url(self):
        return "{}/{}".format(self.ftp_host, self.ftp_path)

    def get_description(self):
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
        self._download_file(self.get_ftp_filename(), self.get_local_path())
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
        self._download_file(self.get_ftp_schema_filename(), self.get_local_schema_path())
        self.update_progress('Fixing: ' + self.get_ftp_schema_filename())
        mysql_to_pg = MySQLtoPG(self.get_local_schema_path(), self.genome)
        mysql_to_pg.convert()

    def _download_file(self, filename, out_filename):
        if not os.path.exists(out_filename):
            ftp = FTP(self.ftp_host)
            ftp.login()
            ftp.cwd(self.get_ftp_dir())
            with open(out_filename, 'wb') as outfile:
                ftp.retrbinary("RETR " + filename, outfile.write)
            ftp.close()


class GenomeDownloader(object):
    """
    Represents a *.txt.gz file and accompanying *.sql(schema) we can download from UCSC.
    """
    def __init__(self, local_dir, ftp_host, ftp_path, genome, update_progress):
        self.local_dir = os.path.join(local_dir, genome)
        self.ftp_host = ftp_host
        self.ftp_path = ftp_path
        self.genome = genome
        self.update_progress = update_progress
        if not os.path.exists(self.local_dir):
            os.mkdir(self.local_dir)

    def download_and_convert(self):
        self._download_file(self.get_ftp_filename(), self.get_local_schema_path())
        if self.get_local_schema_path().endswith(".2bit"):
            two_bit_filename = self.get_local_schema_path()
            fasta_filename = re.sub(".2bit$", ".fa", two_bit_filename)
            fix_script = "twoBitToFa"
            ret = subprocess.call([fix_script, two_bit_filename, fasta_filename])
            if ret != 0:
                raise ValueError("Failed to convert 2bit a file:" + str(ret))

    def _download_file(self, filename, out_filename):
        if not os.path.exists(out_filename):
            self.update_progress('Downloading: ' + self.get_ftp_schema_filename())
            ftp = FTP(self.ftp_host)
            ftp.login()
            ftp.cwd(self.get_ftp_dir())
            with open(out_filename, 'wb') as outfile:
                ftp.retrbinary("RETR " + filename, outfile.write)
            ftp.close()

    def get_ftp_dir(self):
        return os.path.dirname(self.ftp_path)

    def get_ftp_filename(self):
        return os.path.basename(self.ftp_path)

    def get_local_schema_path(self):
        return os.path.join(self.local_dir, self.get_ftp_schema_filename())

    def get_ftp_schema_filename(self):
        return re.sub(r".txt.gz$", ".sql", self.get_ftp_filename())


class MySQLtoPG(object):
    def __init__(self, schema_path, genome):
        self.schema_path = schema_path
        self.genome = genome

    def convert(self):
        converted_schema = ''
        with open(self.schema_path, 'r') as infile:
            for line in infile.readlines():
                if MySQLtoPG.include(line):
                    converted_schema += self.format(line)
        with open(self.schema_path, 'w') as outfile:
            outfile.write(converted_schema.replace(',\n) ;', '\n);'))

    @staticmethod
    def include(line):
        if line.startswith("--") or line.startswith('/*') or len(line.strip()) == 0 \
                or line.startswith("DROP") or line.startswith('  KEY'):
            return False
        return True

    def format(self, line):
        line = line.replace('`', '')
        line = line.replace('longblob', 'bytea')
        line = line.replace('ENGINE=MyISAM DEFAULT CHARSET=latin1', '')
        line = line.replace('int(10) unsigned', 'bigint')
        line = line.replace('int(11)', 'bigint')
        line = line.replace('smallint(5) unsigned', 'int')
        line = line.replace('CREATE TABLE ', 'CREATE TABLE ' + self.genome + '.')
        line = re.sub('enum\(.*\)', 'varchar', line)
        return line