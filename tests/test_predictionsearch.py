from unittest import TestCase
from pred.webserver.predictionsearch import get_all_values, SearchArgs


class TestPredictionSearch(TestCase):
    def test_get_all_values_without_size(self):
        prediction = {
            'start': 0,
            'end': 5,
            'values': [
                {
                    'start': 1,
                    'value': 1.2
                }
            ]
        }
        expected = ['0', '1.2', '0', '0', '0']
        self.assertEqual(expected, get_all_values(prediction, None))

    def test_get_all_values_with_size(self):
        prediction = {
            'start': 0,
            'end': 5,
            'values': [
                {
                    'start': 1,
                    'value': 1.2
                },
                {
                    'start': 2,
                    'value': 5.2
                },
            ]
        }
        expected = ['0', '1.2', '5.2', '0', '0', '0', '0', '0']
        self.assertEqual(expected, get_all_values(prediction, 8))

    def test_negative_values_guess_size(self):
        prediction = {
            'start': 0,
            'end': 5,
            'values': [
                {
                    'start': 1,
                    'value': -1.2
                }
            ]
        }
        expected = ['0', '-1.2', '0', '0', '0']
        self.assertEqual(expected, get_all_values(prediction, None))

    def test_negative_values_guess_with_size(self):
        prediction = {
            'start': 0,
            'end': 5,
            'values': [
                {
                    'start': 1,
                    'value': -1.2
                }
            ]
        }
        expected = ['0', '-1.2', '0', '0', '0', '0']
        self.assertEqual(expected, get_all_values(prediction, 6))

    def test_overlap_most_extreem_value_wins(self):
        prediction = {
            'start': 0,
            'end': 5,
            'values': [
                {
                    'start': 1,
                    'value': 1.2
                },
                {
                    'start': 1,
                    'value': -1.3
                },
            ]
        }
        expected = ['0', '-1.3', '0', '0', '0']
        self.assertEqual(expected, get_all_values(prediction, None))


class TestSearchArgs(TestCase):
    def test_get_binding_site_list(self):
        # default to False
        search_args = SearchArgs(max_stream_val=100, args={})
        self.assertFalse(search_args.get_binding_site_list())

        # test bindingSiteList 'true' value
        search_args = SearchArgs(max_stream_val=100, args={
            'bindingSiteList': 'true'
        })
        self.assertTrue(search_args.get_binding_site_list())

        # test bindingSiteList 'false' value
        search_args = SearchArgs(max_stream_val=100, args={
            'bindingSiteList': 'false'
        })
        self.assertFalse(search_args.get_binding_site_list())

        # test bindingSiteList '' value
        search_args = SearchArgs(max_stream_val=100, args={
            'bindingSiteList': ''
        })
        self.assertFalse(search_args.get_binding_site_list())
