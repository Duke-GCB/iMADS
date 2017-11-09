from unittest import TestCase
from pred.webserver.predictionsearch import SearchArgs, CUSTOM_RANGES_LIST
from pred.webserver.csvgenerator import make_row_generator
from mock import Mock, patch


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
             'name': 'uc021oeg.2', 'max': '0.2582', 'chrom': 'chr1', 'commonName': 'LOC729737', 'strand': '-'},
            {'values': [], 'start': '240366', 'end': '240766',
             'name': 'jjbbjj.1', 'max': '0', 'chrom': 'chr1', 'commonName': 'JJ1924', 'strand': '-'},
        ]
        self.search_args = SearchArgs(max_stream_val=2000, args={
            SearchArgs.UPSTREAM: 1000,
            SearchArgs.DOWNSTREAM: 1000,
            SearchArgs.GENE_LIST: 'somelist'
        })

    def strip_list(self, values):
        return [value.strip() for value in values]

    def assertStartsWith(self, expected_prefix, value_str):
        self.assertEqual(expected_prefix, value_str[:len(expected_prefix)])

    def test_make_predictions_csv_response_simple(self):
        generator = make_row_generator(Mock(), Mock(), self.search_args)
        csv_lines = self.strip_list(generator.generate_rows(self.predictions))
        expected_data = [
            'Name,ID,Max,Chromosome,Start,End',
            'DDX11L1,uc001aaa.3; uc010nxq.1; uc010nxr.1,0.3301,chr1,11673,12073',
            'WASH7P,uc009vjb.1,0.3603,chr1,29761,30161',
            'LOC729737,uc021oeg.2,0.2582,chr1,140366,140766',
            'JJ1924,jjbbjj.1,0,chr1,240366,240766'
        ]
        self.assertEqual(expected_data, csv_lines)

    def test_make_predictions_csv_response_include_all(self):
        self.search_args.args[SearchArgs.INCLUDE_ALL] = 'true'

        generator = make_row_generator(Mock(), Mock(), self.search_args)
        csv_lines = self.strip_list(generator.generate_rows(self.predictions))
        self.assertEqual(5, len(csv_lines))
        self.assertStartsWith('Name,ID,Max,Chromosome,Start,End,-1000,-999,-998', csv_lines[0])
        self.assertStartsWith('DDX11L1,uc001aaa.3; uc010nxq.1; uc010nxr.1,0.3301,chr1,11673,12073,', csv_lines[1])
        self.assertStartsWith('WASH7P,uc009vjb.1,0.3603,chr1,29761,30161,0,0,', csv_lines[2])
        self.assertStartsWith('LOC729737,uc021oeg.2,0.2582,chr1,140366,140766,0,0,', csv_lines[3])
        self.assertStartsWith('JJ1924,jjbbjj.1,0,chr1,240366,240766,0,0,', csv_lines[4])

    @patch('pred.webserver.csvgenerator.DNALookup')
    def test_make_predictions_csv_response_binding_site_list(self, mock_dna_lookup):
        mock_dna_lookup.return_value.lookup_dna_sequence.side_effect = ['ACGGTTA','GGAAATT','TTAAGGG','ATATAT']
        self.search_args.args[SearchArgs.BINDING_SITE_LIST] = 'true'

        generator = make_row_generator(Mock(download_dir='/data'), 'hg38', self.search_args)
        csv_lines = self.strip_list(generator.generate_rows(self.predictions))
        self.assertEqual(6, len(csv_lines))
        expected_header = 'Name,ID,Max,Chromosome,Start,End,Binding site location,Binding site score,DNA Sequence'
        self.assertEqual(expected_header, csv_lines[0])
        dxx_line = 'DDX11L1,uc001aaa.3; uc010nxq.1; uc010nxr.1,0.3301,chr1,11673,12073'
        self.assertEqual('{},chr1:11710-11730,0.3301,ACGGTTA'.format(dxx_line), csv_lines[1])
        self.assertEqual('{},chr1:11904-11924,0.2867,GGAAATT'.format(dxx_line), csv_lines[2])
        wash_line = 'WASH7P,uc009vjb.1,0.3603,chr1,29761,30161'
        self.assertEqual('{},chr1:30018-30038,0.3603,TTAAGGG'.format(wash_line), csv_lines[3])
        loc_line = 'LOC729737,uc021oeg.2,0.2582,chr1,140366,140766'
        self.assertEqual('{},chr1:140628-140648,0.2582,ATATAT'.format(loc_line), csv_lines[4])
        jj_line = 'JJ1924,jjbbjj.1,0,chr1,240366,240766'
        self.assertEqual('{},,,'.format(jj_line), csv_lines[5])

    def test_make_predictions_csv_response_custom_range_list(self):
        self.search_args.args[SearchArgs.GENE_LIST] = CUSTOM_RANGES_LIST

        generator = make_row_generator(Mock(), Mock(), self.search_args)
        csv_lines = self.strip_list(generator.generate_rows(self.predictions))
        self.assertEqual(5, len(csv_lines))
        self.assertEqual('Chromosome,Start,End,Max', csv_lines[0])
        self.assertEqual('chr1,11673,12073,0.3301', csv_lines[1])
        self.assertEqual('chr1,29761,30161,0.3603', csv_lines[2])
        self.assertEqual('chr1,140366,140766,0.2582', csv_lines[3])
        self.assertEqual('chr1,240366,240766,0', csv_lines[4])

    def test_make_predictions_csv_response_custom_range_list_include_all(self):
        self.search_args.args[SearchArgs.GENE_LIST] = CUSTOM_RANGES_LIST
        self.search_args.args[SearchArgs.INCLUDE_ALL] = 'true'

        generator = make_row_generator(Mock(), Mock(), self.search_args)
        csv_lines = self.strip_list(generator.generate_rows(self.predictions))
        self.assertEqual(5, len(csv_lines))
        self.assertEqual('Chromosome,Start,End,Max,Values', csv_lines[0])
        self.assertStartsWith('chr1,11673,12073,0.3301,0,0,', csv_lines[1])
        self.assertStartsWith('chr1,29761,30161,0.3603,0,0,', csv_lines[2])
        self.assertStartsWith('chr1,140366,140766,0.2582,0,0,', csv_lines[3])
        self.assertStartsWith('chr1,240366,240766,0,0,', csv_lines[4])
