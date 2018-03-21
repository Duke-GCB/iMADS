export const COLUMN_FORMAT_STANDARD = 'standard';
export const COLUMN_FORMAT_NUMERIC_BINDING_SITES = 'numericBindingSites';
export const COLUMN_FORMAT_BINDING_SITES_LIST = 'bindingSiteList';
export const COLUMN_FORMAT_RAW_DATA = 'rawData';

export function GeneNameColumnFormats() {
    const standardLabel = 'Name, ID, Genomic region coordinates, Maximum iMADS score ' +
        '(One line per region)';
    const numericBindingSitesLabel = 'Name, ID, Genomic region coordinates, iMADS scores for all positions in region ' +
        '(One line per region)';
    const bindingSiteListLabel = 'Name, ID, Binding site coordinates, Binding site iMADS score, Binding site sequence ' +
        '(One line per site)';
    const formats = {};
    formats[COLUMN_FORMAT_STANDARD] = { label: standardLabel };
    formats[COLUMN_FORMAT_NUMERIC_BINDING_SITES] = { label: numericBindingSitesLabel };
    formats[COLUMN_FORMAT_BINDING_SITES_LIST] = { label: bindingSiteListLabel };
    return formats;
}

export function CustomRangeColumnFormats() {
    const standardLabel = 'Genomic region coordinates, Maximum iMADS score (One line per region)';
    const numericBindingSitesLabel = 'Genomic region coordinates, iMADS scores for all positions in region (One line per region)';
    const bindingSiteListLabel = 'Genomic region coordinates, Binding site coordinates, ' +
        'Binding site iMADS score, Binding site >sequence (One line per site)';
    const formats = {};
    formats[COLUMN_FORMAT_STANDARD] = { label: standardLabel };
    formats[COLUMN_FORMAT_NUMERIC_BINDING_SITES] = { label: numericBindingSitesLabel };
    formats[COLUMN_FORMAT_BINDING_SITES_LIST] = { label: bindingSiteListLabel };
    return formats;
}

export function CustomDNAColumnFormats() {
    const standardLabel = 'Name, Sequence, Maximum iMADS score (One line per input sequence)';
    const numericBindingSitesLabel = 'Name, Sequence, iMADS scores for all positions (One line per input sequence)';
    const rawFormatLabel = 'Name, Start, Stop, iMADS score, Binding site sequence (BED format; one line per binding site)';
    const formats = {};
    formats[COLUMN_FORMAT_STANDARD] = { label: standardLabel };
    formats[COLUMN_FORMAT_NUMERIC_BINDING_SITES] = { label: numericBindingSitesLabel };
    formats[COLUMN_FORMAT_RAW_DATA] = { label: rawFormatLabel, isTabDelimited: true};
    return formats;
}
