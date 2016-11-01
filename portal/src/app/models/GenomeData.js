const PREFERENCE_TYPE = 'PREFERENCE';

export function getTrackHubUrl(genomeData, genomeName) {
    return genomeData[genomeName].trackhubUrl;
}

export function getFirstGenomeName(genomeData) {
    return Object.keys(genomeData)[0];
}

export function getPreferenceSettings(genomeData, genomeName, modelName) {
    let genomeObj = genomeData[genomeName];
    if (!genomeObj) {
        return {
            isPreference: false,
        };
    }
    for (let modelObj of genomeObj.models) {
        if (modelObj.name == modelName) {
            if (modelObj.data_type == PREFERENCE_TYPE) {
                return {
                    isPreference: true,
                    preferenceBins: modelObj.preference_bins,
                }
            }
        }
    }
    return {
        isPreference: false,
    }
}

export function getCoreRange(genomeData, genomeName, modelName) {
    let genomeObj = genomeData[genomeName];
    if (!genomeObj) {
        return {};
    }
    for (let modelObj of genomeObj.models) {
        if (modelObj.name == modelName) {
            return {
                coreOffset: modelObj.core_offset,
                coreLength: modelObj.core_length,
            }
        }
    }
    return {}
}