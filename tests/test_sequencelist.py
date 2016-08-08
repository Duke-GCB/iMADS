from unittest import TestCase
from pred.webserver.sequencelist import SequenceListItems

class TestSequenceListItems(TestCase):
    def test_make_fasta(self):
        values = [
            #input      output
            ("ACGT\n",    ">seq0001\nACGT"),
            ("ACGT", ">seq0001\nACGT"),
            ("ACGT\nAACC\n", ">seq0001\nACGT\n>seq0002\nAACC"),
            (">stuff\nACGT\n", ">stuff\nACGT"),
        ]
        for in_value, out_value in values:
            result = SequenceListItems.make_fasta(in_value)
            self.assertEqual(out_value, result)

    def test_find_items_simple(self):
        data = "ACGT\nAAACCCGGTT\nTTTTTTTT"
        items = SequenceListItems.find_sequence_items(SequenceListItems.make_fasta(data))
        self.assertEqual(3, len(items))
        self.assertEqual(1, items[0]['idx'])
        self.assertEqual('seq0001', items[0]['name'])
        self.assertEqual('ACGT', items[0]['sequence'])
        self.assertEqual(2, items[1]['idx'])
        self.assertEqual('seq0002', items[1]['name'])
        self.assertEqual('AAACCCGGTT', items[1]['sequence'])
        self.assertEqual(3, items[2]['idx'])
        self.assertEqual('seq0003', items[2]['name'])
        self.assertEqual('TTTTTTTT', items[2]['sequence'])

    def test_find_items_fasta(self):
        data = """>HSBGPG Human gene for bone gla protein (BGP)
GGCAGATTCCCCCTAGACCCGCCCGCACCATGGTCAGGCATGCCCCTCCTCATCGCTGGGCACAGCCCAGAGGGT
ATAAACAGTGCTGGAGGCTGGCGGGGCAGGCCAGCTGAGTCCTGAGCAGCAGCCCAGCGCAGCCACCGAGACACC
>HSGLTH1 Human theta 1-globin gene
CCACTGCACTCACCGCACCCGGCCAATTTTTGTGTTTTTAGTAGAGACTAAATACCATATAGTGAACACCTAAGA
CGGGGGGCCTTGGATCCAGGGCGATTCAGAGGGCCCCGGTCGGAGCTGTCGGAGATTGAGCGCGCGCGGTCCCGG
GATCTCCGACGAGGCCCTGGACCCCCGGGCGGCGAAGCTGCGGCGCGGCGCCCCCTGGAGGCCGCGGGACCCCTG
GCCGGTCCGCGCAGGCGCAGCGGGGTCGCAGGGCGCGGCGGGTTCCAGCGCGGGGATGGCGCTGTCCGCGGAGGA"""
        items = SequenceListItems.find_sequence_items(SequenceListItems.make_fasta(data))
        self.assertEqual(2, len(items))
        self.assertEqual(1, items[0]['idx'])
        self.assertEqual('HSBGPG', items[0]['name'])
        self.assertEqual('GGCAGATTCC', items[0]['sequence'][:10])
        self.assertEqual(2, items[1]['idx'])
        self.assertEqual('HSGLTH1', items[1]['name'])
        self.assertEqual('CCACTGCACT', items[1]['sequence'][:10])