from unittest import TestCase

import pred.webserver.customresult
from pred.webserver.customresult import CustomResultData
from pred.webserver.errors import ClientException
from mock import MagicMock, patch


class TestCustomResultData(TestCase):
    def test_find_with_invalid_uuid(self):
        with self.assertRaises(ClientException):
            CustomResultData.find(db=None, sequence_id='', model_name=None)

    def test_find_no_model_filter(self):
        self.query_sql = ''
        self.query_params = ''
        def fake_read_database(db, sql, params):
            self.query_sql = sql
            self.query_params = params
            return [
                ('123', 'ELK1')
            ]

        sv_read_database = pred.webserver.customresult.read_database
        try:
            pred.webserver.customresult.read_database = fake_read_database
            uid = '8B9836B5-8E3D-4346-AB12-69DD10313C77'
            results = CustomResultData.find(db=None, sequence_id=uid, model_name=None)
            self.assertEqual(1, len(results))
            item = results[0]
            self.assertEqual('123', item['resultId'])
            self.assertEqual('ELK1', item['modelName'])
            self.assertEqual('8B9836B5-8E3D-4346-AB12-69DD10313C77', item['sequenceId'])
            self.assertNotIn('custom_result.model_name =', self.query_sql)
            self.assertEqual(['8B9836B5-8E3D-4346-AB12-69DD10313C77'], self.query_params)
        finally:
            pred.webserver.customresult.read_database = sv_read_database

    def test_find_with_model_filter(self):
        self.query_sql = ''
        self.query_params = ''
        def fake_read_database(db, sql, params):
            self.query_sql = sql
            self.query_params = params
            return [
                ('123', 'ELK1')
            ]

        sv_read_database = pred.webserver.customresult.read_database
        try:
            pred.webserver.customresult.read_database = fake_read_database
            uid = '8B9836B5-8E3D-4346-AB12-69DD10313C77'
            results = CustomResultData.find(db=None, sequence_id=uid, model_name='ELK1')
            self.assertEqual(1, len(results))
            item = results[0]
            self.assertEqual('123', item['resultId'])
            self.assertEqual('ELK1', item['modelName'])
            self.assertEqual('8B9836B5-8E3D-4346-AB12-69DD10313C77', item['sequenceId'])
            self.assertIn('custom_result.model_name =', self.query_sql)
            self.assertEqual(['8B9836B5-8E3D-4346-AB12-69DD10313C77', 'ELK1'], self.query_params)
        finally:
            pred.webserver.customresult.read_database = sv_read_database

    def test_last_page_query_and_params(self):
        query, params = CustomResultData.last_page_query_and_params(result_uuid='123-456-789')
        self.assertIn('select count(*)', query)
        self.assertIn('from custom_result', query)
        self.assertIn('custom_result.id = %s', query)
        self.assertEqual(params, ['123-456-789'])

    @patch('pred.webserver.customresult.read_database')
    def test_determine_last_page(self, mock_read_database):
        test_data = [
            # (num_items, per_page, expected_last_page)
            (0, 10, 0),
            (1, 10, 1),
            (10, 10, 1),
            (11, 10, 2),
            (22, 3, 8),
        ]
        for num_items, per_page, expected_last_page in test_data:
            mock_read_database.return_value = [[num_items]]
            last_page = CustomResultData.determine_last_page(db=None, result_uuid='123-456-780', per_page=per_page)
            self.assertEqual(last_page, expected_last_page)

    @patch('pred.webserver.customresult.read_database')
    def test_bed_file_contents(self, mock_read_database):
        mock_read_database.side_effect = [
            [
                # name   dna sequence  (custom_result_sequence_lookup query response data)
                ('wild', 'attattattatt'),
                ('normal', 'catcatcatcat')
            ],
            [
                # name, start, stop, value (bed_file_contents query response data)
                ('wild', 4, 8, 0.9),
                ('normal', 7, 11, 0.4),
            ]
        ]

        bed_contents = CustomResultData.bed_file_contents(db=None, result_id='123')
        expected = """
wild\t4\t8\t0.9\tttat
normal\t7\t11\t0.4\tatca
"""
        self.assertEqual(bed_contents.strip(), expected.strip())

    @patch('pred.webserver.customresult.read_database')
    def test_custom_result_sequence_lookup(self, mock_read_database):
        mock_read_database.return_value = [
            ('wild', 'attattattatt'),
            ('normal', 'catcatcatcat')
        ]

        sequence_lookup = CustomResultData.custom_result_sequence_lookup(db=None, result_id='456')

        self.assertEqual(sequence_lookup, {'normal': 'catcatcatcat', 'wild': 'attattattatt'})
        args, kwargs = mock_read_database.call_args
        db, sql, params = args
        self.assertEqual(params, ['456'])
        self.assertIn('select sequence_list_item.name, sequence_list_item.sequence', sql)


