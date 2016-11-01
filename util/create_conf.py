# Creates config file for webserver based on create_conf.yaml and data downloaded based on that file.

from __future__ import print_function
import os
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
DOWNLOAD_DIR = yaml_config['DOWNLOAD_DIR']
DATA_SOURCES = yaml_config['DATA_SOURCES']
CONFIG_FILENAME = yaml_config['CONFIG_FILENAME']
BINDING_MAX_OFFSET = yaml_config['BINDING_MAX_OFFSET']
GENOMES_FILENAME = yaml_config['GENOMES_FILENAME']
GENOME_SPECIFIC_DATA = yaml_config['GENOME_SPECIFIC_DATA']
SORT_MAX_GUESS_DEFAULT = yaml_config['SORT_MAX_GUESS_DEFAULT']
SORT_MAX_GUESS = yaml_config['SORT_MAX_GUESS']
MODEL_BASE_URL = yaml_config['MODEL_BASE_URL']
MODEL_FAMILY_ORDER = yaml_config['MODEL_FAMILY_ORDER']
PREFERENCE_BINS = {}
for item in yaml_config['PREFERENCE_BINS']:
    genome = item['genome']
    name = item['name']
    preference_bins = item['preference_bins']
    PREFERENCE_BINS[(genome, name)] = preference_bins


def fix_pref_bins(bins):
    for bin_name in ['neg','pos']:
        bins[bin_name] = fix_bin(bins[bin_name])
    return bins


def fix_bin(bin):
    """
    Remove outer indexes make sure values are positive and sorted.
    :param bin: list of values
    :return: [float] fixed array of bin values
    """
    inner_items = bin[1:len(bin)-1]
    return sorted([abs(x) for x in inner_items])


def create_config_file(trackhub_data, output_filename):
    """
    Write out a config file based on trackhub_data and global configuration.
    :param trackhub_data: object: data downloaded from trackhub
    :param output_filename: str: filename to save to
    """
    genome_data = []
    genome_to_track = trackhub_data.get_genomes()
    for genome in sorted(genome_to_track.keys()):
        genome_specific = GENOME_SPECIFIC_DATA.get(genome, {})
        track_filename = genome_to_track[genome]
        track_data = []
        prediction_lists = []
        pred_idx = 1
        for track, url, type, tracks_yaml in trackhub_data.get_track_data(genome, track_filename):
            sort_max_guess = SORT_MAX_GUESS.get(track, SORT_MAX_GUESS_DEFAULT)
            preference_bins = PREFERENCE_BINS.get((genome, track), None)
            prediction_data = {
                'idx': pred_idx,
                'name': track,
                'type': type,
                'url': url,
                'fix_script': FIX_SCRIPT,
                'sort_max_guess': sort_max_guess,
                'core_offset': tracks_yaml.get_core_offset(track),
                'core_length': tracks_yaml.get_core_length(track),
                'family': tracks_yaml.get_family(track, type),
            }
            if preference_bins:
                prediction_data['preference_bins'] = fix_pref_bins(preference_bins)
            pred_idx += 1
            prediction_lists.append(prediction_data)
        prediction_lists = sorted(prediction_lists, key=prediction_sort_key)
        for prediction_data in prediction_lists:
            del prediction_data['idx']
        genome_data.append({
            'genome': '' + genome,
            'genome_file': "goldenPath/{}/bigZips/{}.2bit".format(genome, genome),
            'trackhub_url': genome_specific['trackhub_url'],
            'alias_url': genome_specific['alias_url'],
            'ftp_files': genome_specific['ftp_files'],
            'gene_lists': genome_specific['gene_lists'],
            'prediction_lists': prediction_lists,
        })

    config_data = {
        'binding_max_offset': BINDING_MAX_OFFSET,
        'download_dir': DOWNLOAD_DIR,
        'model_tracks_url_list': trackhub_data.get_tracks_yml_urls(),
        'model_base_url': MODEL_BASE_URL,
        'genome_data': genome_data,
    }
    with open(output_filename, 'w') as outfile:
        yaml.safe_dump(config_data, outfile, default_flow_style=False)
    print("Wrote config file to {}".format(output_filename))


def prediction_sort_key(pred_data):
    return MODEL_FAMILY_ORDER.index(pred_data['family']), pred_data['idx']


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
    def __init__(self, data_source_url, type, model_tracks_url):
        self.remote_data = RemoteData(data_source_url)
        self.type = type
        self.tracks_yaml = TracksYAML(model_tracks_url)

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
        :return: [(track_name, url, type)] list of tracks and their urls
        """
        result = []
        track = ''
        family = ''
        try:
            lines = self.remote_data.get_lines_for_path(track_filename)
            for name, value in get_key_value_list(lines):
                if name == 'track':
                    track = value
                if name == 'bigDataUrl':
                    url = self.remote_data.create_url('{}/{}'.format(genome, value))

                    result.append((track, url, self.type, self.tracks_yaml))
        except requests.HTTPError as err:
            msg = "Error fetching {} for {} error: {}"
            print(msg.format(genome, track, err))
        return result

    def get_tracks_yml_urls(self):
        return [self.tracks_yaml.url]


class CompositeTrackHubData(object):
    """
    Allows a list of TrackHubData to act like a single TrackHubData.
    """
    def __init__(self, trackhub_list):
        """
        Create composite trackhub from a list.
        :param trackhub_list: [TrackHubData] trackhubs to combine
        """
        self.trackhub_list = trackhub_list

    def get_genomes(self):
        """
        Create genome version to trackDB dictionary.
        :param remote_data: lines from trackhub file
        :return: dict: genome to trackDB URL.
        """
        genome_to_track = {}
        for trackhub in self.trackhub_list:
            genome_to_track.update(trackhub.get_genomes())
        return genome_to_track

    def get_track_data(self, genome, track_filename):
        """
        Given track filename return list of tracks, url.
        :param track_filename: filename to lookup track data for.
        :return: [(track_name, url, type)] list of tracks and their urls
        """
        result = []
        for trackhub in self.trackhub_list:
            result.extend(trackhub.get_track_data(genome, track_filename))
        return result

    def get_tracks_yml_urls(self):
        return [trackhub.tracks_yaml.url for trackhub in self.trackhub_list]


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
        self.url = url
        resp = requests.get(url)
        resp.raise_for_status()
        self.track_name_to_items = {}
        for item in yaml.safe_load(resp.text):
            self.track_name_to_items[item['track_name']] = item

    def get_family(self, track_name, default_family):
        item = self.track_name_to_items.get(track_name)
        if not item:
            return default_family
        return item['family']

    def get_core_offset(self, track_name):
        item = self.track_name_to_items.get(track_name)
        if not item:
            return None
        core_start = item['core_start']
        if core_start:
            return int(core_start)
        else:
            half_core_length = self.get_core_length(track_name)/2
            half_width = int(item.get('width', 20))/2
            return int(half_width - half_core_length)

    def get_core_length(self, track_name):
        item = self.track_name_to_items.get(track_name)
        if not item:
            return None
        return len(item['cores'][0])




if __name__ == '__main__':
    trackhub_list = []
    for data_source in DATA_SOURCES:
        trackhub_list.append(TrackHubData(data_source['url'], data_source['type'], data_source['model_tracks_url']))
    create_config_file(CompositeTrackHubData(trackhub_list), CONFIG_FILENAME)
