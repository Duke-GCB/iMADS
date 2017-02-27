from unittest import TestCase

import pred.webserver.customresult
from pred.webserver.customresult import CustomResultData
from pred.webserver.errors import ClientException


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

    def test_find_with_model_filter(self):
        self.query_sql = ''
        self.query_params = ''
        def fake_read_database(db, sql, params):
            self.query_sql = sql
            self.query_params = params
            return [
                ('123', 'ELK1')
            ]
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
