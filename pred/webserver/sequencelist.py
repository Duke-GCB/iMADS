"""
Stores custom FASTA sequences under a uuid in the database.
Part of the tables used for custom jobs.
"""
import uuid
from pred.webserver.errors import ClientException, ErrorType
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
        self.title = None

    def insert(self, db):
        """
        Save self.contents to the database under self.seq_uuid.
        :param db: database connection
        """
        if not self.content:
            raise ValueError("SequenceList content property must be filled in before calling save.")
        if not self.title:
            raise ValueError("SequenceList title property must be filled in before calling save.")
        seq_item_list = SequenceListItems(self.content)
        cur = db.cursor()
        self._insert_data(cur, seq_item_list, self.title)
        cur.close()
        db.commit()

    def _insert_data(self, cur, item_list, title):
        cur.execute("insert into sequence_list(id, data, title) values(%s, %s, %s)",
                    [self.seq_uuid, item_list.data, title])
        for item in item_list.items:
            cur.execute("insert into sequence_list_item(seq_id, idx, name, sequence) values(%s, %s, %s, %s)",
                        [self.seq_uuid, item['idx'], item['name'], item['sequence']])

    def load(self, db):
        """
        Load self.contents from the database based on self.seq_uuid.
        :param db: database connection
        """
        rows = read_database(db, "select data, created, title from sequence_list where id = %s", [self.seq_uuid])
        if not rows:
            raise KeyError("Unable to find sequence for {}".format(self.seq_uuid))
        first_row = rows[0]
        self.content = first_row[0]
        self.created = first_row[1]
        self.title = first_row[2]

    @staticmethod
    def create_with_content_and_title(db, content, title):
        """
        Saves content into the database under a new uuid.
        :param db: database connection
        :param content: str: FASTA file data to save in the database
        :return: str: new uuid created for this content
        """
        sequence_list = SequenceList(str(uuid.uuid1()))
        sequence_list.content = content
        sequence_list.title = title
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

    @staticmethod
    def delete_old_and_unattached(cur, hours):
        result = []
        select_sql = "select sequence_list.id from sequence_list " \
                     " left outer join job on sequence_list.id = job.seq_id " \
                     " where job.id is null " \
                     " and CURRENT_TIMESTAMP  - sequence_list.created > interval '{} hours'".format(hours)
        cur.execute(select_sql, [])
        for row in cur.fetchall():
            seq_id = row[0]
            cur.execute("delete from sequence_list_item where seq_id = %s", [seq_id])
            cur.execute("delete from sequence_list where id = %s", [seq_id])
        return result


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
                    result += ">seq{}\n".format(cnt)
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
        SequenceListItems.verify_unique_names(results)
        return results

    @staticmethod
    def verify_unique_names(items):
        """
        Make sure that we don't have any duplicate names in the list.
        Raises UserFacingException if the names are duplicated.
        :param items: [{}]: list of dictionaries with name property to check
        """
        unique_names = set([item['name'] for item in items])
        if len(unique_names) != len(items):
            raise ClientException("Error: Duplicate sequence names found.", ErrorType.INVALID_SEQUENCE_DATA)
