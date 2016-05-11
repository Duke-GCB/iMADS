export const CUSTOM_GENE_LIST = 'Custom Gene List';
export const CUSTOM_RANGES_LIST = 'Custom Ranges List';

let SETTINGS = [];
SETTINGS[CUSTOM_GENE_LIST] = {
    sampleData: "WASH7P",
};
SETTINGS[CUSTOM_RANGES_LIST] = {
    sampleData: "chr1\t10413\t11027",
};

export function isCustomList(str) {
    return str === CUSTOM_GENE_LIST || str == CUSTOM_RANGES_LIST
}

function lookupSettings(type) {
    if (type in SETTINGS) {
        return SETTINGS[type];
    } else {
        return {
            sampleData: "",
        };
    }
}

export class CustomListData {
    constructor(type) {
        let settings = lookupSettings(type);
        this.type = type;
        this.sampleData = settings.sampleData;
    }

    isGeneList() {
        return this.type == CUSTOM_GENE_LIST;
    }
}
