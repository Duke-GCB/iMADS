from unittest import TestCase
from pred.config import parse_config_from_dict

TRACKHUB_URL = "http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hub.txt"

CONFIG_DATA = {
    "binding_max_offset": 5000,
    "download_dir": "/tmp/pred_data",
    'model_base_url': 'someModelURL',
    'model_tracks_url_list': ['someTracksURL'],
    "genome_data": [
        {
            "genome": "hg19",
            "trackhub_url": TRACKHUB_URL,
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


class TestConfigLoading(TestCase):
    def test_parsed_config(self):
        config = parse_config_from_dict(CONFIG_DATA)
        self.assertEqual(5000, config.binding_max_offset)
        self.assertEqual('/tmp/pred_data', config.download_dir)
        self.assertEqual('someModelURL', config.model_base_url)
        self.assertEqual(['someTracksURL'], config.model_tracks_url_list)
        genomes_setup = config.get_genomes_setup()
        self.assertEqual(1, len(genomes_setup))
        hg19 = genomes_setup['hg19']
        self.assertEqual(TRACKHUB_URL, hg19['trackhubUrl'])
        self.assertEqual('goldenPath/hg19/bigZips/hg19.2bit', hg19['genomeFile'])
        self.assertEqual(['knowngene'], hg19['geneLists'])
        self.assertEqual('E2F1_0001(JS)', hg19['models'][0]['name'])
        self.assertEqual(set(['E2F1_0001(JS)']), config.get_all_model_names())