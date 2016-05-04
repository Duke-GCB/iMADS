import os
import twobitreader
from pred.paramvalidation import verify_genome, verify_chrom


def lookup_dna_sequence(config, genome, ranges):
    verify_genome(genome)
    genome_file = os.path.join(config.download_dir, genome, genome + '.2bit')
    genome = twobitreader.TwoBitFile(genome_file)
    sequences = {}
    for item in ranges:
        chrom = verify_chrom(item['chrom'])
        start = item['start']
        end = item['end']
        name = item['name']
        seq = genome[chrom][int(start)-1:int(end)].upper()
        sequences[name] = seq
    return sequences
