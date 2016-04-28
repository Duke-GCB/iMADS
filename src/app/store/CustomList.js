export const CUSTOM_GENE_LIST = 'Custom Gene List';
export const CUSTOM_RANGES_LIST = 'Custom Ranges List';

var SETTINGS = [];
SETTINGS[CUSTOM_GENE_LIST] = {
    sampleData: "WASH7P\nSAMD11\nRIMKLA",
    encode: encodeGeneListValue,
    decode: decodeGeneListValue
};
SETTINGS[CUSTOM_RANGES_LIST] = {
    sampleData: "chr1\t10413\t11027\nchr2\t520413\t521391",
    encode: noop,
    decode: noop,
};


export function is_custom_list(str) {
    return str === CUSTOM_GENE_LIST || str == CUSTOM_RANGES_LIST
}

function lookup_settings(type) {
    if (type in SETTINGS) {
        return SETTINGS[type];
    } else {
        return {
            sampleData: "",
            encode: noop,
            decode: noop,
        };
    }
}

function encodeGeneListValue(value) {
    return value;
}

function decodeGeneListValue(value) {
    return value;
}

function noop(value) {
    return value;
}

export class CustomListData {
    constructor(type) {
        var settings = lookup_settings(type);
        this.type = type;
        this.sampleData = settings.sampleData;
        this.encodeFunc = settings.encode;
        this.decodeFunc = settings.decode;
    }

    isGeneList() {
        return this.type == CUSTOM_GENE_LIST;
    }

    encode(value) {
        return this.encodeFunc(value);
    }

    decode(value) {
        return this.decodeFunc(value);
    }


}