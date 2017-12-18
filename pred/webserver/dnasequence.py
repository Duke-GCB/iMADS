import os
import twobitreader
from pred.webserver.paramvalidation import verify_genome, verify_chrom


def lookup_dna_sequences_for_ranges(config, genome, ranges):
    dna_lookup = DNALookup(config, genome)
    sequences = {}
    for item in ranges:
        chrom = verify_chrom(item['chrom'])
        start = item['start']
        end = item['end']
        name = item['name']
        sequences[name] = dna_lookup.lookup_dna_sequence(chrom, start, end)
    return sequences


class DNALookup(object):
    def __init__(self, config, genome):
        verify_genome(genome)
        genome_file = os.path.join(config.download_dir, genome, genome + '.2bit')
        self.genome = twobitreader.TwoBitFile(genome_file)

    def lookup_dna_sequence(self, chrom, start, end):
        return self.genome[chrom][int(start)-1:int(end)].upper()
