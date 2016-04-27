import re


class CustomList(object):
    def __init__(self, is_gene_list, data):
        self.is_gene_list = is_gene_list
        self.data = data

    def get_gene_name_tuple(self):
        if not self.is_gene_list:
            raise ValueError("Programmer error this is not a gene list.")
        lines = self.data.split('\n')
        gene_names = [re.sub("\t.*", "", line) for line in lines]
        result = tuple(gene_names)
        return result

    def get_ranges_array(self):
        if self.is_gene_list:
            raise ValueError("Programmer error this is not a ranges list.")
        lines = self.data.split('\n')
        result = []
        try:
            for idx, line in enumerate(lines):
                if line:
                    parts = line.split('\t')
                    name = "range{}".format(idx + 1)
                    result.append([name, parts[0], parts[1], parts[2]])
        except IndexError:
            raise ValueError("Invalid range value format.")
        return result

