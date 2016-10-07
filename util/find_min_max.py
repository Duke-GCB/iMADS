"""
Prints yaml entries for adding to create_conf.yaml PREF_MIN_MAX.
Finds the min and max for each preference file passed in.
Usage: python find_min_max.py ../*_vs_*.bed
You can download these files by running: python load.py download
"""

from __future__ import print_function
import sys
import os
import csv


def get_pref_min_max(path):
    """
    Find the min and max value for a bedfile.
    :param path: str: path to preference bed file
    :return:
    """
    pref_min = -1
    pref_max = 1
    with open(path) as infile:
        csv_reader = csv.reader(infile, delimiter='\t')
        for parts in csv_reader:
            val = float(parts[3])
            pref_min = min(pref_min, val)
            pref_max = max(pref_max, val)
    return pref_min, pref_max


def get_genome_and_name(path):
    filename = os.path.basename(path)
    parts = filename.split("_")
    return parts[0], '_'.join(parts[1:]).replace(".bed", "")


files = sys.argv[1:]
for path in files:
    genome, name = get_genome_and_name(path)
    pref_min,pref_max = get_pref_min_max(path)
    print('- genome: {}'.format(genome))
    print('  name: {}'.format(name))
    print('  pref_min: {}'.format(pref_min))
    print('  pref_max: {}'.format(pref_max))

