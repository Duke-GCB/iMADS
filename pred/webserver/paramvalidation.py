import re

ALPHANUMERIC_STR = '\w+'
INTEGER_STR = '[0-9]+'


def verify_genome(genome):
    if not re.match(ALPHANUMERIC_STR, genome):
        raise ValueError("Invalid genome value: {}", genome)
    return genome


def verify_chrom(chrom):
    if not re.match(ALPHANUMERIC_STR, chrom):
        raise ValueError("Invalid chromosome value: {}", chrom)
    return chrom