"""
Stores custom FASTA sequences under a uuid in the database.
Part of the tables used for custom jobs.
"""
import uuid
from pred.queries.dbutil import update_database, read_database
from Bio import SeqIO
from StringIO import StringIO

class SequenceList(object):
    """
    CRUD for managing FASTA file contents in the database.
    """
    def __init__(self, seq_uuid):
        """
        Setup sequence list with primary key seq_uuid.
        :param seq_uuid: str: uuid that uniquely represents this list.
        """
        if not seq_uuid:
            raise ValueError("SequenceList uuid must have a value yours:'{}'.".format(seq_uuid))
        self.seq_uuid = seq_uuid
        self.content = None
        self.created = None

    def insert(self, db):
        """
        Save self.contents to the database under self.seq_uuid.
        :param db: database connection
        """
        if not self.content:
            raise ValueError("SequenceList content property must be filled in before calling save.")
        item_list = SequenceListItems(self.content)
        cur = db.cursor()
        self._insert_data(cur, item_list)
        cur.close()
        db.commit()

    def _insert_data(self, cur, item_list):
        cur.execute("insert into sequence_list(id, data) values(%s, %s)",
                    [self.seq_uuid, item_list.data])
        for item in item_list.items:
            cur.execute("insert into sequence_list_item(seq_id, idx, name, sequence) values(%s, %s, %s, %s)",
                        [self.seq_uuid, item['idx'], item['name'], item['sequence']])

    def load(self, db):
        """
        Load self.contents from the database based on self.seq_uuid.
        :param db: database connection
        """
        rows = read_database(db, "select data, created from sequence_list where id = %s", [self.seq_uuid])
        first_row = rows[0]
        self.content = first_row[0]
        self.created = first_row[1]

    @staticmethod
    def create_with_content(db, content):
        """
        Saves content into the database under a new uuid.
        :param db: database connection
        :param content: str: FASTA file data to save in the database
        :return: str: new uuid created for this content
        """
        sequence_list = SequenceList(str(uuid.uuid1()))
        sequence_list.content = content
        sequence_list.insert(db)
        return sequence_list.seq_uuid

    @staticmethod
    def read_list(db, seq_uuid):
        """
        Lookup the content from the database via the seq_uuid provided.
        :param db: database connection
        :param seq_uuid: str: uuid to lookup
        :return: str: FASTA file data associated with the seq_uuid
        """
        sequence_list = SequenceList(seq_uuid)
        sequence_list.load(db)
        return sequence_list


class SequenceListItems(object):
    """
    Record per sequence name in SequenceList.
    Used to lookup sequence for results.
    """
    def __init__(self, data):
        self.data = SequenceListItems.make_fasta(data.strip())
        self.items = SequenceListItems.find_sequence_items(self.data)

    @staticmethod
    def make_fasta(data):
        """
        Convert string to FASTA if necessary.
        :param data: str: input value either FASTA or newline separated sequences
        :return: str: FASTA data
        """
        result = data
        if not data.startswith(">"):
            result = ""
            cnt = 1
            for line in data.split('\n'):
                if line:
                    result += ">seq{0:04d}\n".format(cnt)
                    result += line
                    result += "\n"
                    cnt += 1
        return result.strip()

    @staticmethod
    def find_sequence_items(data):
        """
        Parse FASTA data and return a list of {idx, name, sequence}.
        :param data: str: FASTA data to parse
        :return: [dict]: sequences in the FASTA data
        """
        results = []
        cnt = 1
        seqs = SeqIO.parse(StringIO(data), 'fasta')
        for seq in seqs:
            results.append({
                'idx': cnt,
                'name': seq.name,
                'sequence': str(seq.seq)
            })
            cnt += 1
        return results
