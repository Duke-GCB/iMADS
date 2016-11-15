from unittest import TestCase
from pred.webserver.errors import ClientException, ErrorType, raise_on_too_big_uploaded_data
from pred.webserver.customlist import save_custom_file, RANGE_TYPE, GENE_LIST_TYPE, CustomListParser
from pred.webserver.sequencelist import SequenceList


def make_too_big():
    """
    Returns a string too big to store as custom data (> 20MB).
    """
    return "12" * 20 * 1024 * 1024


def make_good_size():
    """
    Returns a string a valid size to store as custom data (<= 20MB).
    """
    return "1" * 19 * 1024 * 1024


class FakeDB(object):
    """
    Fake database so we can test the size checking code while skipping the database code.
    """
    def cursor(self):
        return self

    def __getattr__(self, name):
        def _dummy(*args, **kwargs):
            pass
        return _dummy


class TestRaiseOnTooBig(TestCase):
    """
    Tests core method use to check for content too big.
    """
    def test_raises_when_too_big(self):
        with self.assertRaises(ClientException) as cm:
            raise_on_too_big_uploaded_data(make_too_big())
        self.assertEqual(ErrorType.UPLOADED_DATA_TOO_BIG, cm.exception.error_type)
        self.assertEqual(400, cm.exception.status_code)

    def test_no_raises_when_valid_size(self):
        raise_on_too_big_uploaded_data(make_good_size())


class TestTooBigCustomList(TestCase):
    """
    Custom range and gene lists should return a client error when data is too big.
    """
    def test_range_list_too_big(self):
        with self.assertRaises(ClientException) as cm:
            save_custom_file(db=FakeDB(), user_info=None, type=RANGE_TYPE, content=make_too_big())
        self.assertEqual(ErrorType.UPLOADED_DATA_TOO_BIG, cm.exception.error_type)
        self.assertEqual(400, cm.exception.status_code)

    def test_range_list_good_size(self):
        save_custom_file(db=FakeDB(), user_info=None, type=RANGE_TYPE, content="chr1 100 200\nchr2 200 300")

    def test_gene_list_too_big(self):
        with self.assertRaises(ClientException) as cm:
            save_custom_file(db=FakeDB(), user_info=None, type=GENE_LIST_TYPE, content=make_too_big())
        self.assertEqual(ErrorType.UPLOADED_DATA_TOO_BIG, cm.exception.error_type)
        self.assertEqual(400, cm.exception.status_code)

    def test_gene_list_good_size(self):
        save_custom_file(db=FakeDB(), user_info=None, type=GENE_LIST_TYPE, content="WASH7P\ELK1\NETS2")


class TestTooBigCustomSequence(TestCase):
    """
    Custom DNA sequence list should return a client error when data is too big.
    """
    def test_sequence_too_big(self):
        with self.assertRaises(ClientException) as cm:
            seq_list = SequenceList('1234')
            seq_list.content = make_too_big()
            seq_list.title = 'Too big list'
            seq_list.insert(db=FakeDB())
        self.assertEqual(ErrorType.UPLOADED_DATA_TOO_BIG, cm.exception.error_type)
        self.assertEqual(400, cm.exception.status_code)

    def test_sequence_good_size(self):
        seq_list = SequenceList('1234')
        seq_list.content = "myseq>\nAACCGGTTAACCGTTTTTAACCTTGGG"
        seq_list.title = 'Good list'
        seq_list.insert(db=FakeDB())


