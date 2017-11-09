from unittest import TestCase
from pred.webserver.predictionsearch import SearchArgs, CUSTOM_RANGES_LIST
from pred.webserver.csvgenerator import make_row_generator


class RowGeneratorTests(TestCase):
    def setUp(self):
        self.predictions = [
            {'values': [{u'start': 11710, u'end': 11730, u'value': 0.3301},
                        {u'start': 11904, u'end': 11924, u'value': 0.2867}], 'start': '11673', 'end': '12073',
             'name': 'uc001aaa.3; uc010nxq.1; uc010nxr.1', 'max': '0.3301', 'chrom': 'chr1', 'commonName': 'DDX11L1',
             'strand': '+'},
            {'values': [{u'start': 30018, u'end': 30038, u'value': 0.3603}], 'start': '29761', 'end': '30161',
             'name': 'uc009vjb.1', 'max': '0.3603', 'chrom': 'chr1', 'commonName': 'WASH7P', 'strand': '-'},
            {'values': [{u'start': 140628, u'end': 140648, u'value': 0.2582}], 'start': '140366', 'end': '140766',
             'name': 'uc021oeg.2', 'max': '0.2582', 'chrom': 'chr1', 'commonName': 'LOC729737', 'strand': '-'}
        ]
        self.search_args = SearchArgs(max_stream_val=2000, args={
            SearchArgs.UPSTREAM: 1000,
            SearchArgs.DOWNSTREAM: 1000,
            SearchArgs.GENE_LIST: 'somelist'
        })

    def assertStartsWith(self, expected_prefix, value_str):
        self.assertEqual(expected_prefix, value_str[:len(expected_prefix)])

    def test_make_predictions_csv_response_simple(self):
        generator = make_row_generator(self.search_args)
        csv_lines = list(generator.generate_rows(self.predictions))
        self.assertEqual(4, len(csv_lines))
        self.assertEqual('Name,ID,Max,Chromosome,Start,End', csv_lines[0].strip())
        self.assertEqual('DDX11L1,uc001aaa.3; uc010nxq.1; uc010nxr.1,0.3301,chr1,11673,12073', csv_lines[1].strip())
        self.assertEqual('WASH7P,uc009vjb.1,0.3603,chr1,29761,30161', csv_lines[2].strip())
        self.assertEqual('LOC729737,uc021oeg.2,0.2582,chr1,140366,140766', csv_lines[3].strip())

    def test_make_predictions_csv_response_include_all(self):
        self.search_args.args[SearchArgs.INCLUDE_ALL] = 'true'

        generator = make_row_generator(self.search_args)
        csv_lines = list(generator.generate_rows(self.predictions))
        self.assertEqual(4, len(csv_lines))
        self.assertStartsWith('Name,ID,Max,Chromosome,Start,End,-1000,-999,-998', csv_lines[0])
        self.assertStartsWith('DDX11L1,uc001aaa.3; uc010nxq.1; uc010nxr.1,0.3301,chr1,11673,12073,', csv_lines[1])
        self.assertStartsWith('WASH7P,uc009vjb.1,0.3603,chr1,29761,30161,0,0,', csv_lines[2])
        self.assertStartsWith('LOC729737,uc021oeg.2,0.2582,chr1,140366,140766,0,0,', csv_lines[3])

    def test_make_predictions_csv_response_custom_range_list(self):
        self.search_args.args[SearchArgs.GENE_LIST] = CUSTOM_RANGES_LIST

        generator = make_row_generator(self.search_args)
        csv_lines = list(generator.generate_rows(self.predictions))
        self.assertEqual(4, len(csv_lines))
        self.assertEqual('Chromosome,Start,End,Max', csv_lines[0].strip())
        self.assertEqual('chr1,11673,12073,0.3301', csv_lines[1].strip())
        self.assertEqual('chr1,29761,30161,0.3603', csv_lines[2].strip())
        self.assertEqual('chr1,140366,140766,0.2582', csv_lines[3].strip())

    def test_make_predictions_csv_response_custom_range_list_include_all(self):
        self.search_args.args[SearchArgs.GENE_LIST] = CUSTOM_RANGES_LIST
        self.search_args.args[SearchArgs.INCLUDE_ALL] = 'true'

        generator = make_row_generator(self.search_args)
        csv_lines = list(generator.generate_rows(self.predictions))
        self.assertEqual(4, len(csv_lines))
        self.assertEqual('Chromosome,Start,End,Max,Values', csv_lines[0].strip())
        self.assertStartsWith('chr1,11673,12073,0.3301,0,0,', csv_lines[1])
        self.assertStartsWith('chr1,29761,30161,0.3603,0,0,', csv_lines[2])
        self.assertStartsWith('chr1,140366,140766,0.2582,0,0,', csv_lines[3])
