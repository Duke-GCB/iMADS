"""
Creates TSV/CSV data based on predictions
"""
from pred.webserver.predictionsearch import get_all_values


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


def make_row_format(args):
    """
    Based on args create a RowFormat object
    :param args: SearchArgs: settings used to determine which RowFormat class to create
    :return: object with get_headers and make_rows methods
    """
    if args.is_custom_ranges_list():
        if args.get_include_all():
            return CustomRangesWithValuesRowFormat(args)
        else:
            return CustomRangesRowFormat(args)
    else:
        if args.get_include_all():
            return NumericColumnRowFormat(args)
        else:
            return BaseRowFormat(args)


def make_row_generator(args):
    """
    Create object that will create a generator for returning CSV or TSV data.
    :param args: SearchArgs: settings used to determine which RowFormat class to create
    :return: RowGenerator: call generate_rows to generate lines for CSV/TSV data
    """
    separator = ','
    if args.get_format() == 'tsv':
        separator = '\t'
    return RowGenerator(separator, make_row_format(args))
