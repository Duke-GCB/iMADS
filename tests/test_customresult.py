from unittest import TestCase

import pred.webserver.customresult
from pred.webserver.customresult import CustomResultData
from pred.webserver.errors import ClientException


class TestCustomResultData(TestCase):
    def test_find_with_invalid_uuid(self):
        with self.assertRaises(ClientException):
            CustomResultData.find(None, '')

    def test_find_with_valid_uuid(self):
        def fake_read_database(db, sql, params):
            return [
                ('123', 'ELK1')
            ]
        pred.webserver.customresult.read_database = fake_read_database
        uid = '8B9836B5-8E3D-4346-AB12-69DD10313C77'
        results = CustomResultData.find(None, uid)
        self.assertEqual(1, len(results))
        item = results[0]
        self.assertEqual('123', item['resultId'])
        self.assertEqual('ELK1', item['modelName'])
        self.assertEqual('8B9836B5-8E3D-4346-AB12-69DD10313C77', item['sequenceId'])
