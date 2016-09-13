# Creates config file for webserver based on create_conf.yaml and data downloaded based on that file.

from __future__ import print_function
import sys
import re
import requests
import yaml
from collections import OrderedDict


# Hack to make yaml print out somewhat in order

class UnsortableList(list):
    def sort(self, *args, **kwargs):
        pass


class UnsortableOrderedDict(OrderedDict):
    def items(self, *args, **kwargs):
        return UnsortableList(OrderedDict.items(self, *args, **kwargs))


yaml.add_representer(UnsortableOrderedDict, yaml.representer.SafeRepresenter.represent_dict)


FIX_SCRIPT = 'bigBedToBed'
YAML_CONFIG_FILE = 'create_conf.yaml'

# load global configuration from YAML_CONFIG_FILE
yaml_config = {}
with open(YAML_CONFIG_FILE) as infile:
    yaml_config = yaml.safe_load(infile)
DATA_SOURCE_URL = yaml_config['DATA_SOURCE_URL']
CONFIG_FILENAME = yaml_config['CONFIG_FILENAME']
BINDING_MAX_OFFSET = yaml_config['BINDING_MAX_OFFSET']
GENOMES_FILENAME = yaml_config['GENOMES_FILENAME']
GENOME_SPECIFIC_DATA = yaml_config['GENOME_SPECIFIC_DATA']
SORT_MAX_GUESS_DEFAULT = yaml_config['SORT_MAX_GUESS_DEFAULT']
SORT_MAX_GUESS = yaml_config['SORT_MAX_GUESS']
CORE_SETTINGS_DEFAULT = yaml_config['CORE_SETTINGS_DEFAULT']
CORE_SETTINGS = yaml_config['CORE_SETTINGS']
MODEL_TRACKS_URL = yaml_config['MODEL_TRACKS_URL']
MODEL_BASE_URL = yaml_config['MODEL_BASE_URL']


def create_config_file(trackhub_data, output_filename):
    """
    Write out a config file based on trackhub_data and global configuration.
    :param trackhub_data: object: data downloaded from trackhub
    :param output_filename: str: filename to save to
    """
    genome_data = []
    genome_to_track = trackhub_data.get_genomes()
    track_name_to_family = TracksYAML(MODEL_TRACKS_URL).get_track_name_to_family()
    for genome in sorted(genome_to_track.keys()):
        genome_specific = GENOME_SPECIFIC_DATA.get(genome, {})
        track_filename = genome_to_track[genome]
        track_data = []
        prediction_lists = []
        for track, url in trackhub_data.get_track_data(genome, track_filename):
            sort_max_guess = SORT_MAX_GUESS.get(track, SORT_MAX_GUESS_DEFAULT)
            core_settings = CORE_SETTINGS.get(track, CORE_SETTINGS_DEFAULT)
            prediction_data = {
                'name': track,
                'url': url,
                'fix_script': FIX_SCRIPT,
                'sort_max_guess': sort_max_guess,
                'core_offset': core_settings[0],
                'core_length': core_settings[1],
                'family': track_name_to_family[track],
            }
            prediction_lists.append(prediction_data)
        genome_data.append({
            'genome': '' + genome,
            'genome_file': "goldenPath/{}/bigZips/{}.2bit".format(genome, genome),
            'trackhub_url': genome_specific['trackhub_url'],
            'ftp_files': genome_specific['ftp_files'],
            'gene_lists': genome_specific['gene_lists'],
            'prediction_lists': prediction_lists,
        })

    config_data = {
        'binding_max_offset': BINDING_MAX_OFFSET,
        'download_dir': '/tmp/pred_data',
        'model_tracks_url': MODEL_TRACKS_URL,
        'model_base_url': MODEL_BASE_URL,
        'genome_data': genome_data,
    }
    with open(output_filename, 'w') as outfile:
        yaml.safe_dump(config_data, outfile, default_flow_style=False)
    print("Wrote config file to {}".format(output_filename))


def get_key_value_list(lines):
    """
    Split lines at the first space.
    :param lines: lines from trackhub file
    :return: [(name, value)] where name is before first space and value is after first space
    """
    result = []
    for line in lines:
        line = line.strip()
        if line:
            parts = line.split(" ", 1)
            name = parts[0]
            value = parts[1]
            result.append((name, value))
    return result


class TrackHubData(object):
    """
    Data from trackhub related to genomes and their predictions stored there.
    """
    def __init__(self, data_source_url):
        self.remote_data = RemoteData(data_source_url)

    def get_genomes(self):
        """
        Create genome version to trackDB dictionary.
        :param remote_data: lines from trackhub file
        :return: dict: genome to trackDB URL.
        """
        genome = ''
        genome_to_track = {}
        lines = self.remote_data.get_lines_for_path(GENOMES_FILENAME)
        for name, value in get_key_value_list(lines):
            if name == 'genome':
                genome = value
            if name == 'trackDb':
                genome_to_track[genome] = value
        return genome_to_track

    def get_track_data(self, genome, track_filename):
        """
        Given track filename return list of tracks, url.
        :param track_filename: filename to lookup track data for.
        :return: [(track_name, url, family)] list of tracks and their urls
        """
        result = []
        track = ''
        family = ''
        lines = self.remote_data.get_lines_for_path(track_filename)
        for name, value in get_key_value_list(lines):
            if name == 'track':
                track = value
            if name == 'bigDataUrl':
                url = self.remote_data.create_url('{}/{}'.format(genome, value))

                result.append((track, url))
        return result


class RemoteData(object):
    """
    Retrieves data in trackhub format.
    """
    def __init__(self, data_source_url):
        """
        Setup base url.
        :param data_source_url: str: base url all requests are prefixed with
        """
        self.data_source_url = data_source_url

    def get_text_for_path(self, path):
        """
        Return text for url built from path.
        :param path: str: suffix of url added to data_source_url and fetched
        :return: text of request
        """
        url = self.create_url(path)
        response = requests.get(url)
        response.raise_for_status()
        return response.text

    def get_lines_for_path(self, path):
        """
        Return lines for url built from path.
        :param path: str: suffix of url added to data_source_url and fetched
        :return: [str]: lines from request
        """
        return self.get_text_for_path(path).split('\n')

    def create_url(self, suffix):
        """
        Join data_source_url and suffix.
        :param suffix: str: end of url
        :return: str: combined url
        """
        return '{}/{}'.format(self.data_source_url, suffix)


class TracksYAML(object):
    """
    Downloads tracks YAML data.
    """
    def __init__(self, url):
        """
        Download YAML data based on the url.
        :param url: str: url to the master tracks YAML file.
        """
        resp = requests.get(url)
        resp.raise_for_status()
        self.data = yaml.safe_load(resp.text)

    def get_track_name_to_family(self):
        """
        Return dictionary of track_name -> family name
        :return: dict, str -> str trackname lookup
        """
        result = {}
        for item in self.data:
            result[item['track_name']] = item['family']

        return result

if __name__ == '__main__':
    create_config_file(TrackHubData(DATA_SOURCE_URL), CONFIG_FILENAME)
