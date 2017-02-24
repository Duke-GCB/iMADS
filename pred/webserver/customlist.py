import uuid
from pred.webserver.errors import raise_on_too_big_uploaded_data

RANGE_TYPE = 'range'
GENE_LIST_TYPE = 'gene_list'

MAX_RANGE_SUM = 30 * 1000 * 1000
MAX_RANGE_ERROR_STR = "You are only allowed {} in total ranges.".format(MAX_RANGE_SUM)

def save_custom_file(db, user_info, type, content):
    if type != RANGE_TYPE and type != GENE_LIST_TYPE:
        raise ValueError("Unsupported type {}".format(type))
    if not content:
        raise ValueError("Didn't receive any content.")
    custom_list = CustomListParser(type == GENE_LIST_TYPE, content)
    custom_list.save(db, user_info)
    return custom_list.key


def does_custom_list_exist(db, key):
    cur = db.cursor()
    cur.execute("select count(*) from custom_list where id = %s limit 1", [key])
    exists = False
    if cur.fetchone()[0] > 0:
        exists = True
    cur.close()
    db.commit()
    return exists


def get_gene_name_set(db, key):
    names = set()
    cur = db.cursor()
    cur.execute("select gene_name from custom_gene_list where id = %s", [key])
    for row in cur.fetchall():
        names.add(row[0])
    cur.close()
    db.commit()
    return names


class CustomList(object):
    def __init__(self, is_gene_list, key, custom_list_filter):
        self.is_gene_list = is_gene_list
        self.key = key
        self.custom_list_filter = custom_list_filter


class CustomListParser(object):
    def __init__(self, is_gene_list, data):
        raise_on_too_big_uploaded_data(data)
        self.is_gene_list = is_gene_list
        self.data = data
        self.key = None

    def get_gene_name_tuple(self):
        if not self.is_gene_list:
            raise ValueError("Programmer error this is not a gene list.")
        lines = self.data.split('\n')
        gene_names = []
        for line in lines:
            if line:
                parts = line.split()
                if parts:
                    gene_names.append(parts[0])
        result = tuple(gene_names)
        return result

    def get_ranges_array(self):
        if self.is_gene_list:
            raise ValueError("Programmer error this is not a ranges list.")
        lines = self.data.split('\n')
        result = []
        for idx, line in enumerate(lines):
            if line:
                parts = line.split()
                name = "range{}".format(idx + 1)
                try:
                    result.append([name, parts[0], parts[1], parts[2]])
                except IndexError:
                    raise ValueError("Invalid range value format:{}".format(line))
        return result

    def get_type(self):
        if self.is_gene_list:
            return GENE_LIST_TYPE
        return RANGE_TYPE

    def save(self, db, user_info):
        cur = db.cursor()
        self.key = self._create_new_list_key(cur, user_info)
        if self.is_gene_list:
            self._create_gene_list_records(cur, self.key)
        else:
            self._create_range_list_records(cur, self.key)
        self._analyze_table(cur)
        cur.close()
        db.commit()

    def _create_new_list_key(self, cur, user_info):
        list_id = str(uuid.uuid1())
        insert, params = custom_list_insert(list_id, user_info, self.get_type())
        cur.execute(insert, params)
        return list_id

    def _create_gene_list_records(self, cur, list_id):
        for idx, gene_name in enumerate(self.get_gene_name_tuple()):
            insert, params = custom_gene_insert(list_id, idx + 1, gene_name)
            cur.execute(insert, params)

    def _create_range_list_records(self, cur, list_id):
        total_size = 0
        for idx, (name, chrom, start, end) in enumerate(self.get_ranges_array()):
            if not chrom.startswith("chr"):
                chrom = "chr" + chrom
            diff = int(end) - int(start)
            total_size += max(0, diff)
            if total_size > MAX_RANGE_SUM:
                raise ValueError(MAX_RANGE_ERROR_STR)
            insert, params = custom_range_insert(list_id, idx + 1, chrom, start, end)
            cur.execute(insert, params)

    def _analyze_table(self, cur):
        if self.is_gene_list:
            cur.execute("analyze custom_gene_list;", [])
        else:
            cur.execute("analyze custom_range_list;", [])


def custom_list_insert(uuid, user_info, type):
    return "insert into custom_list(id, type, user_info) values (%s, %s, %s); ", [uuid, type, user_info]


def custom_range_insert(list_id, seq, chrom, start, end):
    return "insert into custom_range_list(id, seq, chrom, range) values (%s, %s, %s, int4range(%s, %s)); ", \
           [list_id, seq, chrom, start, end]


def custom_gene_insert(list_id, seq, gene_name):
    return "insert into custom_gene_list(id, seq, gene_name) values (%s, %s, %s); ", \
        [list_id, seq, gene_name]
