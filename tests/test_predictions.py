from unittest import TestCase

from pred.config import parse_config, CONFIG_FILENAME
from pred.predictionsearch import PredictionSearch, SearchArgs
from webserver import create_db_connection, make_predictions_csv_response


class TestPredictions(TestCase):
    def setUp(self):
        self.config = parse_config(CONFIG_FILENAME)
        self.db = create_db_connection(self.config.dbconfig)

    def tearDown(self):
        self.db.close()

    def test_csv_output(self):
        genome = 'hg19'
        args = {
            SearchArgs.MODEL: 'E2F1',
            SearchArgs.GENE_LIST: 'knowngene',
            SearchArgs.PAGE: '1',
            SearchArgs.PER_PAGE: '3',
            SearchArgs.UPSTREAM: '2',
            SearchArgs.DOWNSTREAM: '3',
            SearchArgs.INCLUDE_ALL: 'true',

        }
        search = PredictionSearch(self.db, genome, self.config.binding_max_offset, args, enable_guess=True)
        predictions = search.get_predictions()
        search_args = search.args

        result = list(make_predictions_csv_response(predictions, search_args))
        self.assertEqual(4, len(result))
        header = result[0]
        expected_header = 'Name,ID,Max,Location,Start,End,-2,-1,0,1,2,3\n'
        some_val =        'NOC2L,uc001abz.4,chr1,0.228,894677,894681,0.227558,0,0,0,0,0'
        self.assertEqual(expected_header, header)

