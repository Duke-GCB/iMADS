from unittest import TestCase
import unittest
import os
import subprocess
import time
from StringIO import StringIO
from pred.config import parse_config_from_dict, DataType
from load import run_sql_command
from pred.load import loaddatabase
from pred.load import postgres
from pred.webserver.predictionsearch import get_predictions_with_guess, SearchArgs, CUSTOM_GENE_LIST,\
    CUSTOM_RANGES_LIST, CUSTOM_GENE_NAME_TYPE, CUSTOM_ID_TYPE
from webserver import create_db_connection
from pred.webserver.customlist import save_custom_file, GENE_LIST_TYPE, RANGE_TYPE, MAX_RANGE_ERROR_STR
from pred.webserver.sequencelist import SequenceList
from pred.webserver.customjob import CustomJob, JobStatus
from pred.webserver.customresult import CustomResultData, SEQUENCE_NOT_FOUND
from pred.queries.dbutil import update_database
import json


DOCKER_NAME="TF_DNA_POSTGRES_TEST"
TEST_WITH_DOCKER="TF_TEST_WITH_DOCKER"


def start_docker():
    #subprocess.check_call("eval $(docker-machine env default) && docker run "
    subprocess.check_call("docker run "
                           "-d "
                           "-p " "5432:5432 "
                           "--name " + DOCKER_NAME +
                           " -e " "POSTGRES_DB=pred "
                           " -e " "POSTGRES_USER=pred_user "
                           "postgres", shell=True)


def stop_docker():
    #subprocess.check_call("eval $(docker-machine env default) && docker rm -f -v " + DOCKER_NAME, shell=True)
    subprocess.check_call("docker rm -f -v " + DOCKER_NAME, shell=True)

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
                    "sort_max_guess": 0.6
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


def known_gene_line(name, chrom, strand, txStart, txEnd):
    pattern = "{}	{}	{}	{}	{}	11873	11873	3	11873,12612,13220,	12227,12721,14409,	B7ZGX9	uc001aaa.3"
    return pattern.format(name, chrom, strand, txStart, txEnd)


def make_known_gene_data():
    lines = [
        known_gene_line("uc001aaa.3", "chr1", "+", 11873, 14409),
        known_gene_line("uc010nxr.1", "chr1", "+", 11873, 14409),
        known_gene_line("uc010nxq.1", "chr1", "+", 11873, 14409),
    ]
    return "\n".join(lines)


def make_kg_line(name, common_name):
    pattern = "{}	NR_046018			{}	NR_046018		Homo sapiens DEADRNA	a	b."
    return pattern.format(name, common_name)


def make_kg_xref_data():
    lines = [
        make_kg_line("uc001aaa.3", "DDX11L1"),
        make_kg_line("uc010nxr.1", "DDX11L1"),
        make_kg_line("uc010nxq.1", "DDX11L1"),
    ]
    return "\n".join(lines)


def make_pred_line(chrom, start, stop, value, name):
    pattern = "{}	{}	{}	{}	{}	[{},{}]"
    return pattern.format(chrom, start, stop, value, name, start, stop)


def make_prediction_data():
    #gene starts at 11873
    lines = [
        make_pred_line("chr1", 11874, 11894, 0.4, "E2F1_0001(JS)"),
        make_pred_line("chr1", 11753, 11773, 0.3, "E2F1_0001(JS)"), # far left edge of DDX11L1(11873) upstream 100
        make_pred_line("chr1", 11752, 11772, 0.2, "E2F1_0001(JS)"), # just past far left edge of DDX11L1(11873) upstream 100
        make_pred_line("chr1", 11923, 11943, 0.1, "E2F1_0001(JS)"),  # far right edge of DDX11L1(11873) downstream 50
        make_pred_line("chr1", 11924, 11944, 0.5, "E2F1_0001(JS)"),  # far right edge of DDX11L1(11873) downstream 50
    ]
    return "\n".join(lines)


FILENAME_TO_DATA = {
    "/tmp/pred_data/hg19/knownGene.txt": make_known_gene_data(),
    "/tmp/pred_data/hg19/kgXref.txt": make_kg_xref_data(),
    "/tmp/pred_data/hg19/hg19-0001-E2F1-E2F1-bestSVR.model.tsv": make_prediction_data(),
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


def skip_docker_tests():
    return os.environ.get(TEST_WITH_DOCKER) != "true"


@unittest.skipIf(skip_docker_tests(), "Docker testing env variable not set.")
class TestWithDocker(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not skip_docker_tests():
            start_docker()
            time.sleep(5)
            TestWithDocker.config = parse_config_from_dict(CONFIG_DATA)
            TestWithDocker.config.dbconfig.host = "localhost"
            TestWithDocker.config.dbconfig.dbname = 'pred'
            TestWithDocker.config.dbconfig.user = 'pred_user'
            run_sql_command(TestWithDocker.config)

    @classmethod
    def tearDownClass(cls):
        if not skip_docker_tests():
            stop_docker()

    def test_prediction_query(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        params = {
            SearchArgs.GENE_LIST: "knowngene",
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "50",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)
        first_pred = predictions[0]
        self.assertEqual(first_pred['name'], 'uc001aaa.3; uc010nxq.1; uc010nxr.1')
        values = first_pred['values']
        self.assertEqual(len(values), 3)
        pred_value_set = set([v['value'] for v in values])
        self.assertIn(0.4, pred_value_set)
        self.assertIn(0.3, pred_value_set)
        self.assertIn(0.1, pred_value_set)

    def test_prediction_max_sort_query(self):
        #
        db = create_db_connection(TestWithDocker.config.dbconfig)
        params = {
            SearchArgs.GENE_LIST: "knowngene",
            SearchArgs.MAX_PREDICTION_SORT: "true",
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "50",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)
        first_pred = predictions[0]
        self.assertEqual(first_pred['name'], 'uc001aaa.3; uc010nxq.1; uc010nxr.1')
        values = first_pred['values']
        self.assertEqual(len(values), 3)
        pred_value_set = set([v['value'] for v in values])
        self.assertIn(0.4, pred_value_set)
        self.assertIn(0.3, pred_value_set)
        self.assertIn(0.1, pred_value_set)

    def test_custom_gene_list_no_results(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', GENE_LIST_TYPE, "cheese")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_GENE_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.CUSTOM_GENE_SEARCH_TYPE: CUSTOM_GENE_NAME_TYPE,
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
            SearchArgs.CUSTOM_GENE_SEARCH_TYPE: CUSTOM_GENE_NAME_TYPE,
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
            SearchArgs.CUSTOM_GENE_SEARCH_TYPE: CUSTOM_ID_TYPE,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)
        first_pred_name = predictions[0]['name']
        first_pred_name_parts = first_pred_name.split("; ")
        self.assertEqual(len(first_pred_name_parts), 2)
        self.assertIn("uc001aaa.3", first_pred_name_parts)
        self.assertIn("uc010nxr.1", first_pred_name_parts)

    def test_custom_gene_list_with_lc_results(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', GENE_LIST_TYPE, "ddx11l1")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_GENE_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.CUSTOM_GENE_SEARCH_TYPE: CUSTOM_GENE_NAME_TYPE,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)

    def test_custom_range_list(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', RANGE_TYPE, "chr1 11873 11883")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_RANGES_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)
        self.assertEqual(0.4, float(predictions[0]['max']))

    def test_custom_range_list_bad_range(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', RANGE_TYPE, "chr1 91873 91883")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_RANGES_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)
        # we always return a record for range requests just with empty data for the matches
        self.assertEqual('None', predictions[0]['max'])

    def test_custom_range_list_no_chr(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', RANGE_TYPE, "1 11873 11883")
        params = {
            SearchArgs.GENE_LIST: CUSTOM_RANGES_LIST,
            SearchArgs.CUSTOM_LIST_DATA: custom_list_key,
            SearchArgs.MODEL: "E2F1_0001(JS)",
            SearchArgs.UPSTREAM: "100",
            SearchArgs.DOWNSTREAM: "100",
            SearchArgs.PAGE: "1",
            SearchArgs.PER_PAGE: "10",
        }
        predictions, search_args, search_warning = get_predictions_with_guess(db, TestWithDocker.config, "hg19", params)
        self.assertEqual(len(predictions), 1)
        # we always return a record for range requests just with empty data for the matches
        self.assertEqual(0.4, float(predictions[0]['max']))

    def test_custom_range_list_range_sum_too_big(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        try:
            custom_list_key = save_custom_file(db, 'john', RANGE_TYPE, "1 1000 30001001")
            self.fail("Should have raised ValueError exception.")
        except ValueError as err:
            self.assertEqual(str(err), MAX_RANGE_ERROR_STR)

    def test_custom_range_list_range_as_big_as_possible(self):
        db = create_db_connection(TestWithDocker.config.dbconfig)
        custom_list_key = save_custom_file(db, 'john', RANGE_TYPE, "1 1000 30001000")

    def test_sequence_list(self):
        FASTA_DATA1 = """>HSBGPG Human gene for bone gla protein (BGP)
GGCAGATTCCCCCTAGACCCGCCCGCACCATGGTCAGGCATGCCCCTCCTCATCGCTGGGCACAGCCCAGAGGGT
ATAAACAGTGCTGGAGGCTGGCGGGGCAGGCCAGCTGAGTCCTGAGCAGCAGCCCAGCGCAGCCACCGAGACACC
>HSGLTH1 Human theta 1-globin gene
CCACTGCACTCACCGCACCCGGCCAATTTTTGTGTTTTTAGTAGAGACTAAATACCATATAGTGAACACCTAAGA
CGGGGGGCCTTGGATCCAGGGCGATTCAGAGGGCCCCGGTCGGAGCTGTCGGAGATTGAGCGCGCGCGGTCCCGG"""
        FASTA_DATA2 = """>stuff
AAACCCGGGG"""
        db = create_db_connection(TestWithDocker.config.dbconfig)
        sequence_list1_uuid = SequenceList.create_with_content_and_title(db, FASTA_DATA1, "mystuff")
        sequence_list2_uuid = SequenceList.create_with_content_and_title(db, FASTA_DATA2, "mystuff2")
        seq_list1 = SequenceList.read_list(db, sequence_list1_uuid)
        seq_list2 = SequenceList.read_list(db, sequence_list2_uuid)
        self.assertEqual(FASTA_DATA1, seq_list1.content)
        self.assertEqual("mystuff", seq_list1.title)
        self.assertEqual("mystuff2", seq_list2.title)

    def test_customjob(self):
        FASTA_DATA1 = """>stuff\nAAACCCGGGGTT"""
        db = create_db_connection(TestWithDocker.config.dbconfig)

        update_database(db, """
          delete from custom_result_row;
          delete from custom_result;
          delete from job;
          delete from sequence_list_item;
          delete from sequence_list;
        """, [])
        # start out finding no jobs
        jobs = CustomJob.find_jobs(db, None)
        self.assertEqual(len(jobs), 0)

        # create a new job that should be NEW status
        sequence_list = SequenceList.create_with_content_and_title(db, FASTA_DATA1, "somelist")
        job_uuid = CustomJob.create_job(db, DataType.PREDICTION, sequence_list, model_name="E2f1").uuid
        job = CustomJob.read_job(db, job_uuid)
        self.assertEqual(job_uuid, job.uuid)
        self.assertEqual(JobStatus.NEW, job.status)
        self.assertEqual(DataType.PREDICTION, job.type)
        self.assertEqual(sequence_list, job.sequence_list)
        self.assertIsNotNone(job.created)
        self.assertIsNone(job.finished)

        # find NEW job without filters
        jobs = CustomJob.find_jobs(db, None)
        self.assertEqual(len(jobs), 1)
        self.assertEqual(jobs[0].uuid, job_uuid)
        # find no for RUNNING jobs
        jobs = CustomJob.find_jobs(db, JobStatus.RUNNING)
        self.assertEqual(len(jobs), 0)
        # find 1 for NEW jobs
        jobs = CustomJob.find_jobs(db, JobStatus.NEW)
        self.assertEqual(len(jobs), 1)

        # Jobs can be set to running only once (when in NEW state)
        CustomJob.set_job_running(db, job_uuid)
        job = CustomJob.read_job(db, job_uuid)
        self.assertEqual(JobStatus.RUNNING, job.status)
        self.assertIsNone(job.finished)
        # Disallow setting a job running twice (prevents two workers working on the same job)
        with self.assertRaises(ValueError):
            CustomJob.set_job_running(db, job_uuid)

        # find 0 for NEW jobs
        jobs = CustomJob.find_jobs(db, JobStatus.NEW)
        self.assertEqual(len(jobs), 0)

        # Jobs can be set to complete from RUNNING state
        CustomJob.set_job_complete(db, job_uuid)
        job = CustomJob.read_job(db, job_uuid)
        self.assertEqual(JobStatus.COMPLETE, job.status)
        self.assertIsNotNone(job.finished)

        # find 0 for NEW jobs
        jobs = CustomJob.find_jobs(db, JobStatus.NEW)
        self.assertEqual(len(jobs), 0)

        # Jobs can be set to complete from ERROR state
        CustomJob.set_job_as_error(db, job_uuid, "Something failed.")
        job = CustomJob.read_job(db, job_uuid)
        self.assertEqual(JobStatus.ERROR, job.status)
        self.assertEqual("Something failed.", job.error_msg)
        self.assertIsNotNone(job.finished)

        # find 0 for NEW jobs
        jobs = CustomJob.find_jobs(db, JobStatus.NEW)
        self.assertEqual(len(jobs), 0)

    def test_custom_job_normal_workflow(self):
        FASTA_DATA1 = """>someseq\nAAACCCGGGGTT\n>someseq2\nAAACCCGGGGTTAAACCCGGGGTTAAACCCGGGGTTAAACCCGGGGTTAAACCCGGGGTT"""
        db = create_db_connection(TestWithDocker.config.dbconfig)
        # upload FASTA file
        sequence_list = SequenceList.create_with_content_and_title(db, FASTA_DATA1, "sometitle")
        # create a job to determine predictions for a sequence_list
        job_uuid = CustomJob.create_job(db, DataType.PREDICTION, sequence_list, model_name="E2f1").uuid
        # mark job as running
        CustomJob.set_job_running(db, job_uuid)
        # upload file
        BED_DATA = """
someseq\t0\t10\t12.5
someseq2\t20\t30\t4.5
someseq2\t60\t75\t15.5
            """.strip()
        result_uuid = CustomResultData.new_uuid()
        result = CustomResultData(db, result_uuid, job_uuid, model_name='E2f1', bed_data=BED_DATA)
        result.save()
        self.assertEqual(BED_DATA, CustomResultData.bed_file_contents(db, result_uuid).strip())

        predictions = CustomResultData.get_predictions(db, result_uuid, sort_max_value=False,
                                                       limit=None, offset=None)
        self.assertEqual(2, len(predictions))
        first = predictions[0]
        self.assertEqual('someseq', first['name'])
        self.assertEqual(12.5, float(first['max']))
        self.assertEqual([{u'start': 0, u'end': 10, u'value': 12.5}], first['values'])
        self.assertEqual('AAACCCGGGGTT', first['sequence'])

        second = predictions[1]
        self.assertEqual('someseq2', second['name'])
        self.assertEqual(15.5, float(second['max']))
        self.assertEqual('AAACCCGGGGTTAAACCCGGGGTTAAACCCGGGGTTAAACCCGGGGTTAAACCCGGGGTT', second['sequence'])

        predictions = CustomResultData.get_predictions(db, result_uuid, sort_max_value=True,
                                                       limit=None, offset=None)
        self.assertEqual(2, len(predictions))
        self.assertEqual(15.5, float(predictions[0]['max']))
        self.assertEqual(12.5, float(predictions[1]['max']))

        predictions = CustomResultData.get_predictions(db, result_uuid, sort_max_value=True,
                                                       limit=1, offset=1)
        self.assertEqual(1, len(predictions))
        self.assertEqual(12.5, float(predictions[0]['max']))

        # Make sure we can convert predictions to JSON
        json_version = json.dumps({'data': predictions})
        self.assertEqual('{"data', json_version[:6])

    def test_custom_job_no_data(self):
        FASTA_DATA1 = """>someseq\nAAACCCGGGGTT"""
        db = create_db_connection(TestWithDocker.config.dbconfig)
        # upload FASTA file
        sequence_list = SequenceList.create_with_content_and_title(db, FASTA_DATA1, "somelist")
        # create a job to determine predictions for a sequence_list
        job_uuid = CustomJob.create_job(db, DataType.PREDICTION, sequence_list, model_name='E2f1').uuid
        # mark job as running
        CustomJob.set_job_running(db, job_uuid)
        # upload file
        BED_DATA = ''
        result_uuid = CustomResultData.new_uuid()
        result = CustomResultData(db, result_uuid, job_uuid, model_name='E2f1', bed_data=BED_DATA)
        result.save()

        predictions = CustomResultData.get_predictions(db, result_uuid, sort_max_value=False,
                                                       limit=None, offset=None)
        self.assertEqual(1, len(predictions))
        first = predictions[0]
        self.assertEqual('someseq', first['name'])
        self.assertEqual('None', first['max'])
        self.assertEqual([], first['values'])
        self.assertEqual('AAACCCGGGGTT', first['sequence'])
        # Make sure we can convert predictions to JSON
        json_version = json.dumps({'data': predictions})
        self.assertEqual('{"data', json_version[:6])


