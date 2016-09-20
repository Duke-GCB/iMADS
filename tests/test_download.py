from unittest import TestCase
from pred.load.download import ModelFiles


class MockModelFiles(ModelFiles):
    def __init__(self, track_data, model_names):
        self.track_data = track_data
        self.model_names = model_names
        self.model_base_url = 'baseURL'
        self.models_dir = 'modelsDIR'


    def _get_tracks_data(self):
        return self.track_data


class TestModelFiles(TestCase):
    def test_empty_data(self):
        model_files = MockModelFiles([
        ], set())
        data = model_files.get_model_details()
        self.assertEqual(0, len(data))

    def test_sample_data(self):
        model_files = MockModelFiles([
            {
                'model_filenames': ['E2F1-bestSVR.model'],
                'track_name': 'E2F1-bestSVR',
                'protein': 'E2f1',
                'cores': ['AAGG'],
            },
            {
                'model_filenames': ['E2F4-bestSVR.model'],
                'track_name': 'E2F4-bestSVR',
                'protein': 'E2f4',
                'cores': ['AAGG'],
            },
            {
                'model_filenames': [
                    'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGC_1a2a3mer_format.model',
                    'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGG_1a2a3mer_format.model'
                ],
                'track_name': 'E2F1-bestSVR',
                'protein': 'E2f1',
                'cores': ['AAAG','AATT'],
            },
            {
                'model_filenames': ['E2F4-bestSVR.model'],
                'track_name': 'E2F4-bestSVR',
                'protein': 'E2f4',
                'cores': ['AAGG'],
            },
        ], set(['E2F1-bestSVR', 'E2F4-bestSVR']))
        data = model_files.get_model_details()
        expected_names = set(['E2F1-bestSVR.model',
                             'E2F4-bestSVR.model',
                             'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGC_1a2a3mer_format.model',
                             'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGG_1a2a3mer_format.model'
                             ])
        self.assertEqual(expected_names, set([item['filename'] for item in data]))
        details = model_files.get_model_details()
        self.assertEqual(4, len(details))

        old_e2f1_details = [detail for detail in details if detail['filename'] == 'E2F1-bestSVR.model'][0]
        self.assertEqual('baseURL/E2F1-bestSVR.model', old_e2f1_details['url'])
        self.assertEqual('modelsDIR/E2F1-bestSVR.model', old_e2f1_details['local_path'])
        self.assertEqual('Model for core AAGG', old_e2f1_details['description'])

        model_filename = 'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGC_1a2a3mer_format.model'
        new_e2f1_details = [detail for detail in details if detail['filename'] == model_filename][0]
        self.assertEqual('baseURL/{}'.format(model_filename), new_e2f1_details['url'])
        self.assertEqual('modelsDIR/{}'.format(model_filename), new_e2f1_details['local_path'])
        self.assertEqual('Model for core AAAG', new_e2f1_details['description'])

