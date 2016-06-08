from unittest import TestCase
import subprocess
import time
from StringIO import StringIO
from pred.config import parse_config_from_dict
from load import run_sql_command
from pred.load import loaddatabase
from pred.load import postgres
from pred.webserver.predictionsearch import get_predictions_with_guess, SearchArgs, CUSTOM_GENE_LIST
from webserver import create_db_connection
from pred.webserver.customlist import save_custom_file, GENE_LIST_TYPE


DOCKER_NAME="TF_DNA_POSTGRES_TEST"


def start_docker():
    subprocess.check_call("eval $(docker-machine env default) && docker run "
                           "-d "
                           "-p " "5432:5432 "
                           "--name " + DOCKER_NAME +
                           " -e " "POSTGRES_DB=pred "
                           " -e " "POSTGRES_USER=pred_user "
                           "postgres", shell=True)


def stop_docker():
    subprocess.check_call("eval $(docker-machine env default) && docker rm -f -v " + DOCKER_NAME, shell=True)

CONFIG_DATA = {
    "binding_max_offset": 5000,
    "download_dir": "/tmp/pred_data",
    "genome_data": [
        {
            "genome": "hg19",
            "trackhub_url": "http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hub.txt",
            "genome_file": "goldenPath/hg19/bigZips/hg19.2bit",
            "ftp_files": [
                "goldenPath/hg19/database/knownGene.txt.gz",
                "goldenPath/hg19/database/kgXref.txt.gz"
            ],
            "gene_lists": [
                {
                    "name": "UCSC Known Genes",
                    "source_table": "knowngene",
                    "common_name": "genesymbol",
                    "common_lookup_table": "kgxref",
                    "common_lookup_table_field": "kgid",
                }
            ],
            "prediction_lists": [
                {
                    "name": "E2F1_0001(JS)",
                    "url": "http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hg19/hg19-0001-E2F1-E2F1-bestSVR.model.bb",
                    "fix_script": "bigBedToBed",
                }
            ]
        }
    ]
}

FILENAME_TO_SQL = {
    "/tmp/pred_data/hg19/kgXref.sql": """
        CREATE TABLE hg19.kgXref (
          kgID varchar(255) NOT NULL,
          mRNA varchar(255) NOT NULL,
          spID varchar(255) NOT NULL,
          spDisplayID varchar(255) NOT NULL,
          geneSymbol varchar(255) NOT NULL,
          refseq varchar(255) NOT NULL,
          protAcc varchar(255) NOT NULL,
          description bytea NOT NULL,
          rfamAcc varchar(255) NOT NULL,
          tRnaName varchar(255) NOT NULL
        );
    """,
    "/tmp/pred_data/hg19/knownGene.sql": """
        CREATE TABLE hg19.knownGene (
          name varchar(255) NOT NULL DEFAULT '',
          chrom varchar(255) NOT NULL DEFAULT '',
          strand char(1) NOT NULL DEFAULT '',
          txStart bigint NOT NULL DEFAULT '0',
          txEnd bigint NOT NULL DEFAULT '0',
          cdsStart bigint NOT NULL DEFAULT '0',
          cdsEnd bigint NOT NULL DEFAULT '0',
          exonCount bigint NOT NULL DEFAULT '0',
          exonStarts bytea NOT NULL,
          exonEnds bytea NOT NULL,
          proteinID varchar(40) NOT NULL DEFAULT '',
          alignID varchar(255) NOT NULL DEFAULT ''
        );
    """
}

FILENAME_TO_DATA = {
    "/tmp/pred_data/hg19/knownGene.txt":
        """uc001aaa.3	chr1	+	11873	14409	11873	11873	3	11873,12612,13220,	12227,12721,14409,	B7ZGX9	uc001aaa.3
uc010nxr.1	chr1	+	11873	14409	11873	11873	3	11873,12645,13220,	12227,12697,14409,	B7ZGX9	uc010nxr.1
uc010nxq.1	chr1	+	11873	14409	12189	13639	3	11873,12594,13402,	12227,12721,14409,	B7ZGX9	uc010nxq.1""",
    "/tmp/pred_data/hg19/kgXref.txt":
        """uc001aaa.3	NR_046018			DDX11L1	NR_046018		Homo sapiens DEADRNA	a	b.
uc010nxr.1	AM992878			DDX11L1			Homo sapiens DEAD/H (Asp-G	a	b
uc010nxq.1	AM992880	B7ZGX9	B7ZGX9_HUMAN	DDX11L1			Homo sapie	a	b""",
    "/tmp/pred_data/hg19/hg19-0001-E2F1-E2F1-bestSVR.model.tsv":
        """chr1	11874	11894	0.445804778406	E2F1_0001(JS)	[10613,10649]""",
}

def fake_file_modified_time(filename):
    return 1000

def fake_sql_from_filename(filename):
    return FILENAME_TO_SQL[filename]

def fake_copy_from(cursor, filename, destination):
    data = FILENAME_TO_DATA[filename]
    cursor.copy_from(StringIO(data), destination)


loaddatabase.get_modified_time_for_filename = fake_file_modified_time
loaddatabase.sql_from_filename = fake_sql_from_filename
postgres.copy_from = fake_copy_from


class TestWithDocker(TestCase):
    @classmethod
    def setUpClass(cls):
        start_docker()
        time.sleep(5)
        TestWithDocker.config = parse_config_from_dict(CONFIG_DATA)
        TestWithDocker.config.dbconfig.host = subprocess.check_output('docker-machine ip', shell=True)
        TestWithDocker.config.dbconfig.dbname = 'pred'
        TestWithDocker.config.dbconfig.user = 'pred_user'
        run_sql_command(TestWithDocker.config)

    @classmethod
    def tearDownClass(cls):
        stop_docker()

    def test_prediction_query(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        params = {
            SearchArgs.GENE_LIST: "knowngene",
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)

    def test_custom_gene_list_no_results(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', GENE_LIST_TYPE, "cheese")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_GENE_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 0)

    def test_custom_gene_list_with_results(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', GENE_LIST_TYPE, "DDX11L1")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_GENE_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)

    def test_custom_gene_list_id_results(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', GENE_LIST_TYPE, "uc001aaa.3\nuc010nxr.1")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_GENE_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)

    def test_custom_gene_list_with_lc_results(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', GENE_LIST_TYPE, "ddx11l1")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_GENE_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)

    def test_custom_gene_list_id_uc(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', GENE_LIST_TYPE, "UC001AAA.3")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_GENE_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)


