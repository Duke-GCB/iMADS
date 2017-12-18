export const COLUMN_FORMAT_STANDARD = 'standard';
export const COLUMN_FORMAT_NUMERIC_BINDING_SITES = 'numericBindingSites';
export const COLUMN_FORMAT_BINDING_SITES_LIST = 'bindingSiteList';
export const COLUMN_FORMAT_RAW_DATA = 'rawData';

export function GeneNameColumnFormats() {
    const standardLabel = 'Name, ID, Max iMADS score, Chromosome, Start, End';
    const numericBindingSitesLabel = standardLabel + ', followed by all values';
    const bindingSiteListLabel = 'Name, ID, Binding site location, Binding site score, Binding site sequence ' +
        '(one line per binding site)';
    const formats = {};
    formats[COLUMN_FORMAT_STANDARD] = { label: standardLabel };
    formats[COLUMN_FORMAT_NUMERIC_BINDING_SITES] = { label: numericBindingSitesLabel };
    formats[COLUMN_FORMAT_BINDING_SITES_LIST] = { label: bindingSiteListLabel };
    return formats;
}

export function CustomRangeColumnFormats() {
    const standardLabel = 'Chromosome, Start, End, Max iMADS score';
    const numericBindingSitesLabel = standardLabel + ', followed by all values';
    const bindingSiteListLabel = 'Chromosome, Start, End, ' +
        'Binding site location, Binding site score, Binding site sequence ' +
        '(one line per binding site)';
    const formats = {};
    formats[COLUMN_FORMAT_STANDARD] = { label: standardLabel };
    formats[COLUMN_FORMAT_NUMERIC_BINDING_SITES] = { label: numericBindingSitesLabel };
    formats[COLUMN_FORMAT_BINDING_SITES_LIST] = { label: bindingSiteListLabel };
    return formats;
}

export function CustomDNAColumnFormats() {
    const standardLabel = 'Name, Sequence, Max iMADS score';
    const numericBindingSitesLabel = standardLabel + ', followed by all values';
    const rawFormatLabel = 'Name, Start, Stop, iMADS score (BED Format)';
    const formats = {};
    formats[COLUMN_FORMAT_STANDARD] = { label: standardLabel };
    formats[COLUMN_FORMAT_NUMERIC_BINDING_SITES] = { label: numericBindingSitesLabel };
    formats[COLUMN_FORMAT_RAW_DATA] = { label: rawFormatLabel, isTabDelimited: true};
    return formats;
}
