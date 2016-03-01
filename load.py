"""
Load gene list data from genome.ucsc.edu into a Postgres database.
"""
import os
import re
from ftplib import FTP
import gzip
import psycopg2
from urllib.request import urlopen
import subprocess
import tempfile
from config import parse_config

UCSC_HOST = 'hgdownload.cse.ucsc.edu'
DOWNLOAD_CHUNK_SIZE = 16 * 1024
CONFIG_FILENAME = 'predictionsconf.json'


def update_progress(str):
    print(str)

class PredictionDataSource(object):
    def __init__(self, prediction_settings, update_progress=update_progress):
        self.name = prediction_settings.name
        self.local_dir = prediction_settings.local_dir
        self.url = prediction_settings.url
        self.genome = prediction_settings.genome
        self.update_progress = update_progress
        if not os.path.exists(self.local_dir):
            os.mkdir(self.local_dir)

    def get_url_filename(self):
        return os.path.basename(self.url)

    def get_url_filename(self):
        return os.path.basename(self.url)

    def get_local_bigwig_path(self):
        return os.path.join(self.local_dir, self.genome, self.get_url_filename())

    def get_local_bed_path(self):
        bed_filename = re.sub('.bw$', '.bed', self.get_url_filename())
        return os.path.join(self.local_dir, self.genome, bed_filename)

    def download_and_convert(self):
        local_bigwig_path = self.get_local_bigwig_path()
        self.update_progress('Downloading: ' + self.url)
        response = urlopen(self.url)
        with open(local_bigwig_path, 'wb') as outfile:
            while True:
                chunk = response.read(DOWNLOAD_CHUNK_SIZE)
                if chunk:
                    outfile.write(chunk)
                else:
                    break
        self.update_progress('Converting: ' + local_bigwig_path)
        ret = subprocess.call(['bigWigToBedGraph', local_bigwig_path, self.get_local_bed_path()])
        if ret != 0:
            raise ValueError("Failed to convert bigwig:" + str(ret))

    def create(self, psql):
        self.update_progress('Loading data source: ' + self.get_local_bed_path())
        fd, temp_path = tempfile.mkstemp()
        with open(self.get_local_bed_path(), 'r') as bedfile:
            with open(temp_path, 'w') as outfile:
                while True:
                    line = bedfile.readline()
                    if line:
                        outfile.write(line.replace("\n", "\t" + self.name + "\n"))
                    else:
                        break
        os.close(fd)
        psql.copy_file_into_db(self.genome + '.prediction', temp_path,
                               columns=('chrom', 'start_range', 'end_range', 'value', 'model_name'))
        os.remove(temp_path)
        fix_range_sql = 'update ' + self.genome + '.prediction set range = int4range(start_range, end_range) where range is null'
        psql.execute(fix_range_sql, None)

class UCSCDataSource(object):
    """
    Represents a *.txt.gz file and accompanying *.sql(schema) we can download from UCSC.
    """
    def __init__(self, local_dir, ftp_host, ftp_path, genome, update_progress=update_progress):
        self.local_dir = os.path.join(local_dir, genome)
        self.ftp_host = ftp_host
        self.ftp_path = ftp_path
        self.genome = genome
        self.update_progress = update_progress
        if not os.path.exists(self.local_dir):
            os.mkdir(self.local_dir)

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
        ftp = FTP(self.ftp_host)
        ftp.login()
        ftp.cwd(self.get_ftp_dir())
        with open(out_filename, 'wb') as outfile:
            ftp.retrbinary("RETR " + filename, outfile.write)
        ftp.close()


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
            outfile.write(converted_schema.replace(',\n) ;','\n);'))

    @staticmethod
    def include(line):
        if line.startswith("--") or line.startswith('/*') or len(line.strip()) == 0 \
                or line.startswith("DROP") or line.startswith('  KEY'):
            return False
        return True

    def format(self, line):
        line = line.replace('`', '')
        line = line.replace('longblob','bytea')
        line = line.replace('ENGINE=MyISAM DEFAULT CHARSET=latin1', '')
        line = line.replace('int(10) unsigned', 'bigint')
        line = line.replace('int(11)', 'bigint')
        line = line.replace('smallint(5) unsigned', 'int')
        line = line.replace('CREATE TABLE ', 'CREATE TABLE ' + self.genome + '.')
        line = re.sub('enum\(.*\)', 'varchar', line)
        return line


class PGCmdLine(object):
    def __init__(self, db, user, password, update_progress=update_progress):
        self.db = db
        self.user = user
        self.password = password
        self.update_progress = update_progress

    def create_schema(self, schema_name):
        self.update_progress('Creating schema:' + schema_name)
        conn = psycopg2.connect('dbname=' + self.db + ' user=' + self.user)
        cur = conn.cursor()
        cur.execute('CREATE SCHEMA IF NOT EXISTS ' + schema_name)
        conn.commit()
        cur.close()
        conn.close()

    def create_table(self, table_path):
        """
        This loads a schema into the database.
        This schema definition came from UCSC by definition it's a SQL vulnerability.
        :param schema_path: str path to a postgres format schema file
        """
        self.update_progress('Creating table:' + table_path)
        conn = psycopg2.connect('dbname=' + self.db + ' user=' + self.user)
        cur = conn.cursor()
        with open(table_path, 'r') as infile:
            data = infile.read()
            cur.execute(data)
        conn.commit()
        cur.close()
        conn.close()

    def execute(self, sql, params=()):
        self.update_progress('Execute sql:' + sql)
        conn = psycopg2.connect('dbname=' + self.db + ' user=' + self.user)
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        cur.close()
        conn.close()

    def copy_file_into_db(self, table_name, data_filename, columns=None):
        update_progress('Loading table ' + table_name + ' with data:' + data_filename)
        conn = psycopg2.connect('dbname=' + self.db + ' user=' + self.user)
        cur = conn.cursor()
        with open(data_filename,'r') as infile:
            cur.copy_from(infile, table_name, columns=columns)
        conn.commit()
        cur.close()
        conn.close()


def download_ucsc_files(psql, download_dir, genome, file_list):
    for target in file_list:
        data_file = UCSCDataSource(download_dir, UCSC_HOST, target, genome)
        data_file.download_and_extract()
        data_file.download_schema_and_convert()
        psql.create_schema(genome)
        psql.create_table(data_file.get_local_schema_path())
        psql.copy_file_into_db(genome + '.' + data_file.get_root_filename(), data_file.get_extracted_path())


class GeneInfo(object):
    def __init__(self, gene_info_settings):
        self.genome = gene_info_settings.genome
        self.source_table = gene_info_settings.source_table
        self.common_name = gene_info_settings.common_name
        self.common_lookup_table = gene_info_settings.common_lookup_table
        self.common_lookup_table_field = gene_info_settings.common_lookup_table_field

    def create(self, psql):
        schema_prefix = self.genome
        if self.common_lookup_table:
            index_sql = "create index if not exists {}_idx on {}.{}({});".format(self.common_lookup_table,
                                                                                  schema_prefix,
                                                                                  self.common_lookup_table,
                                                                                  self.common_lookup_table_field)
            psql.execute(index_sql, ())
            insert_sql = """insert into {}.gene(gene_list, name, chrom, strand, txstart, txend)
                            select '{}', name, chrom, strand, txstart, txend from
                            {}.{};""".format(schema_prefix, self.source_table,
                                             schema_prefix, self.source_table)
            psql.execute(insert_sql, ())
            update_sql = """update {}.gene set common_name =
                            (select {} from {}.{} where {} = gene.name) where gene_list = '{}';
                         """.format(schema_prefix, self.common_name,
                                    schema_prefix, self.common_lookup_table, self.common_lookup_table_field,
                                    self.source_table)
            psql.execute(update_sql, ())
        else:
            insert_sql = """insert into {}.gene(gene_list, name, common_name, chrom, strand, txstart, txend)
                     select '{}', name, {}, chrom, strand, txstart, txend from
                     {}.{};""".format(schema_prefix, self.source_table, self.common_name,
                                      schema_prefix, self.source_table)
            psql.execute(insert_sql, ())

    def delete_table(self, psql):
        schema_prefix = self.genome
        drop_source_sql = "drop table {}.{};".format(schema_prefix, self.source_table)
        psql.execute(drop_source_sql)
        if self.common_lookup_table:
            drop_lookup_sql = "drop table {}.{};".format(schema_prefix, self.common_lookup_table)
            psql.execute(drop_lookup_sql)

def load_gene_table(psql, gene_lists):
    for gene_list in gene_lists:
        gene_list.create(psql)

def delete_gene_tables(psql, gene_lists):
    for gene_list in gene_lists:
        gene_list.delete_table(psql)


def load_prediction_table(psql, prediction_models):
    for prediction_data_source in prediction_models:
        prediction_data_source.create(psql)


def fill_gene_ranges(psql, genome, binding_max_offset):
    schema_prefix = genome
    update_sql = "update {}.gene set range = int4range(txstart-%s, txstart+%s, '[]') where strand = '+';".format(schema_prefix)
    psql.execute(update_sql, (binding_max_offset, binding_max_offset))
    update_sql = "update {}.gene set range = int4range(txend-%s, txend+%s, '[]') where strand = '-';".format(schema_prefix)
    psql.execute(update_sql, (binding_max_offset, binding_max_offset))


def download_and_convert_predictions(prediction_models):
    for prediction_model in prediction_models:
        prediction_model.download_and_convert()


def create_indexes_if_necessary(psql, schema_prefix):
    update_progress('create indexes indexes if necessary')
    psql.execute('create index if not exists pred_range_idx on {}.prediction using gist(range);'.format(schema_prefix))
    psql.execute('create index if not exists gene_range_idx on {}.gene using gist(range);'.format(schema_prefix))
    psql.execute('create index if not exists gene_list_chrom on {}.gene(gene_list, chrom);'.format(schema_prefix))
    psql.execute('ANALYZE {}.gene'.format(schema_prefix))
    psql.execute('ANALYZE {}.prediction'.format(schema_prefix))

def create_base_tables(psql, schema_prefix):
    sql = """
    create table {}.prediction (
      chrom varchar NOT NULL,
      start_range int NOT NULL,
      end_range int NOT NULL,
      value numeric NOT NULL,
      model_name varchar NOT NULL,
      range int4range,
      PRIMARY KEY (model_name, chrom, start_range)
    );
    GRANT ALL PRIVILEGES ON {}.prediction TO pred_user;
    CREATE index pred_idx on {}.prediction(chrom, start_range, end_range);

    CREATE TABLE {}.gene (
      gene_list varchar NOT NULL,
      name varchar NOT NULL,
      common_name varchar,
      chrom varchar NOT NULL,
      strand char(1) NOT NULL,
      txstart int NOT NULL,
      txend int NOT NULL,
      range int4range
    );
    GRANT ALL PRIVILEGES ON {}.gene TO pred_user;
    CREATE index gene_list_idx on {}.gene(gene_list);
    """.format(schema_prefix, schema_prefix, schema_prefix ,schema_prefix, schema_prefix, schema_prefix)
    psql.execute(sql, ())


def load_database_based_on_config(config):
    dbconfig = config.dbconfig
    psql = PGCmdLine(dbconfig.dbname, dbconfig.user, dbconfig.password)
    for genome_data in config.genome_data_list:
        genome = genome_data.genomename
        create_base_tables(psql, genome)

        gene_lists = [GeneInfo(gene_list_settings) for gene_list_settings in genome_data.gene_lists]
        prediction_lists = [PredictionDataSource(prediction_setting)
                            for prediction_setting in genome_data.prediction_lists]

        download_ucsc_files(psql, config.download_dir, genome, genome_data.ftp_files)
        load_gene_table(psql, gene_lists)
        fill_gene_ranges(psql, genome, config.binding_max_offset)

        download_and_convert_predictions(prediction_lists)
        load_prediction_table(psql, prediction_lists)

        create_indexes_if_necessary(psql, genome)
        delete_gene_tables(psql, gene_lists)


if __name__ == '__main__':
    load_database_based_on_config(parse_config(CONFIG_FILENAME))

"""
Example query for a range:
select * from gene
inner join prediction
on gene.range && prediction.range
and gene.chrom = prediction.chrom
where
gene.gene_list = 'knowngene'
and gene.chrom = 'chr3'
and prediction.model_name = 'E2F1'
and
case strand when '+' then
  (txstart - 2000) < start_range and (txstart + 1000) > end_range
else
  (txend - 2000) < start_range and (txend + 1000) > end_range
end
"""