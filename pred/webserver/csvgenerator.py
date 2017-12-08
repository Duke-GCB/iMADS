"""
Creates TSV/CSV data based on predictions
"""
from pred.webserver.predictionsearch import get_all_values
from pred.webserver.dnasequence import DNALookup


class RowGenerator(object):
    """
    yields CSV/TSV data using row_format for a list of predictions
    """
    def __init__(self, separator, row_format):
        """
        :param separator: str: separator used to build CSV/TSV line
        :param row_format: object with get_headers and make_rows methods
        """
        self.separator = separator
        self.row_format = row_format

    def make_line(self, values):
        return self.separator.join(values) + '\n'

    def generate_rows(self, predictions):
        yield self.make_line(self.row_format.get_headers())
        for prediction in predictions:
            rows = self.row_format.make_rows(prediction)
            for values in rows:
                yield self.make_line(values)


class BaseRowFormat(object):
    """
    Creates simple row with 6 columns.
    """
    def __init__(self, args):
        self.args = args
        self.base_headers = ['Name', 'ID', 'Max', 'Chromosome', 'Start', 'End']
        self.extra_headers = []

    def get_headers(self):
        return self.base_headers + self.extra_headers

    def make_rows(self, prediction):
        """
        Returns a row of values derived from prediction
        :param prediction: dict: list of prediction data rows (see PredictionSearch.get_predictions)
        :return: [[str]]: rows of values
        """
        return [self.make_values(prediction)]

    def make_values(self, prediction):
        return self.make_base_values(prediction)

    def make_base_values(self, prediction):
        start = prediction['start']
        end = prediction['end']
        return [
            prediction['commonName'],
            prediction['name'],
            str(prediction['max']),
            prediction['chrom'],
            str(start),
            str(end)
        ]


class NumericColumnRowFormat(BaseRowFormat):
    """
    Adds numeric columns with individual prediction values to 6 base columns
    """
    def __init__(self, args):
        super(NumericColumnRowFormat, self).__init__(args)
        up = args.get_upstream()
        down = args.get_downstream()
        self.size = up + down + 1
        self.extra_headers = [str(i) for i in range(-1*up, down+1)]

    def make_values(self, prediction):
        values = self.make_base_values(prediction)
        return values + get_all_values(prediction, self.size)


class BindingSiteListRowFormat(BaseRowFormat):
    """
    Adds 3 columns to base values and repeats for each binding site in a prediction
    """
    def __init__(self, config, genome, args):
        """
        :param config: config.Config: system wide configuration
        :param genome: str: name of the genome
        :param args: SearchArgs: settings used to determine which RowFormat class to create
        """
        super(BindingSiteListRowFormat, self).__init__(args)
        self.base_headers = ['Name', 'ID']
        self.dna_lookup = DNALookup(config, genome)
        self.extra_headers = ['Binding site location', 'Binding site score', 'DNA Sequence']

    def make_base_values(self, prediction):
        return [
            prediction['commonName'],
            prediction['name'],
        ]

    def make_rows(self, prediction):
        """
        Returns a row for each binding site location in prediction
        :param prediction: dict: list of prediction data rows (see PredictionSearch.get_predictions)
        :return: [[str]]: rows of values
        """
        rows = []
        chrom = prediction['chrom']
        base_values = self.make_base_values(prediction)
        if prediction['values']:
            for binding_site_data in prediction['values']:
                start = binding_site_data['start']
                end = binding_site_data['end']
                binding_site_location = '{}:{}-{}'.format(chrom, start, end)
                binding_site_score = str(binding_site_data['value'])
                dna_sequence = self.dna_lookup.lookup_dna_sequence(chrom, start, end)
                row = base_values + [binding_site_location, binding_site_score, dna_sequence]
                rows.append(row)
        else:
            row = base_values + ['', '', '']
            rows.append(row)
        return rows


class CustomRangesRowFormat(BaseRowFormat):
    """
    Displays 4 column data based custom range predictions.
    """
    def __init__(self, args):
        super(CustomRangesRowFormat, self).__init__(args)
        self.base_headers = ['Chromosome', 'Start', 'End', 'Max']

    def make_base_values(self, prediction):
        return [
            prediction['chrom'],
            str(prediction['start']),
            str(prediction['end']),
            str(prediction['max'])
        ]


class CustomRangesWithValuesRowFormat(CustomRangesRowFormat):
    """
    Adds numeric column values to CustomRangesRowFormat
    """
    def __init__(self, args):
        super(CustomRangesWithValuesRowFormat, self).__init__(args)
        self.extra_headers = ['Values']

    def make_values(self, prediction):
        values = self.make_base_values(prediction)
        return values + get_all_values(prediction, None)


class CustomRangesBindingLSiteListRowFormat(BindingSiteListRowFormat):
    """
    Adds 3 columns to custom range values and repeats for each binding site in a prediction
    """
    def __init__(self, config, genome, args):
        """
        :param config: config.Config: system wide configuration
        :param genome: str: name of the genome
        :param args: SearchArgs: settings used to determine which RowFormat class to create
        """
        super(CustomRangesBindingLSiteListRowFormat, self).__init__(config, genome, args)
        self.base_headers = ['Chromosome', 'Start', 'End']

    def make_base_values(self, prediction):
        return [
            prediction['chrom'],
            str(prediction['start']),
            str(prediction['end']),
        ]

def make_row_format(config, genome, args):
    """
    Based on config, genome and args create a RowFormat object
    :param config: config.Config: system wide configuration
    :param genome: str: name of the genome
    :param args: SearchArgs: settings used to determine which RowFormat class to create
    :return: object with get_headers and make_rows methods
    """
    if args.is_custom_ranges_list():
        if args.get_binding_site_list():
            return CustomRangesBindingLSiteListRowFormat(config, genome, args)
        elif args.get_include_all():
            return CustomRangesWithValuesRowFormat(args)
        else:
            return CustomRangesRowFormat(args)
    else:
        if args.get_binding_site_list():
            return BindingSiteListRowFormat(config, genome, args)
        elif args.get_include_all():
            return NumericColumnRowFormat(args)
        else:
            return BaseRowFormat(args)


def make_row_generator(config, genome, args):
    """
    Create object that will create a generator for returning CSV or TSV data.
    :param config: config.Config: system wide configuration
    :param genome: str: name of the genome
    :param args: SearchArgs: settings used to determine which RowFormat class to create
    :return: RowGenerator: call generate_rows to generate lines for CSV/TSV data
    """
    separator = ','
    if args.get_format() == 'tsv':
        separator = '\t'
    return RowGenerator(separator, make_row_format(config, genome, args))
