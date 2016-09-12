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
            {
                'model_filenames': []
            }
        ], set())
        filenames = model_files.get_model_filenames()
        self.assertEqual(0, len(filenames))

    def test_sample_data(self):
        model_files = MockModelFiles([
            {
                'model_filenames': ['E2F1-bestSVR.model'],
                'track_name': 'E2F1-bestSVR',
            },
            {
                'model_filenames': ['E2F4-bestSVR.model'],
                'track_name': 'E2F4-bestSVR',
            },
            {
                'model_filenames': [
                    'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGC_1a2a3mer_format.model',
                    'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGG_1a2a3mer_format.model'
                ],
                'track_name': 'E2F1-bestSVR',
            },
            {
                'model_filenames': ['E2F4-bestSVR.model'],
                'track_name': 'E2F4-bestSVR',
            },
        ], set(['E2F1-bestSVR', 'E2F4-bestSVR']))
        filenames = model_files.get_model_filenames()
        expected_names = set(['E2F1-bestSVR.model',
                             'E2F4-bestSVR.model',
                             'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGC_1a2a3mer_format.model',
                             'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGG_1a2a3mer_format.model'
                             ])
        self.assertEqual(expected_names, filenames)
        url, path, desc = model_files.get_model_url_path_and_desc('E2F1-bestSVR.model')
        self.assertEqual('baseURL/E2F1-bestSVR.model', url)
        self.assertEqual('modelsDIR/E2F1-bestSVR.model', path)
        self.assertEqual('E2F1-bestSVR', desc)

        model_filename = 'E2F1_250nM_Bound_filtered_normalized_logistic_transformed_20bp_GCGC_1a2a3mer_format.model'
        url, path, desc = model_files.get_model_url_path_and_desc(model_filename)
        self.assertEqual('baseURL/{}'.format(model_filename), url)
        self.assertEqual('modelsDIR/{}'.format(model_filename), path)
        self.assertEqual('E2F1 20bp GCGC 1a2a3mer', desc)

