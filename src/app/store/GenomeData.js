export function getTrackHubUrl(genomeData, genomeName) {
    return genomeData[genomeName].trackhubUrl;
}

export function getFirstGenomeName(genomeData) {
    return Object.keys(genomeData)[0];
}

export function isPreferenceModel(genomeData, genomeName, modelName) {
    console.log("isPreferenceModel");
    console.log(genomeData);
    console.log(genomeName);
    console.log(modelName);
    let genomeObj = genomeData[genomeName];
    if (!genomeObj) {
        return false;
    }
    for (let modelObj of genomeObj.models) {
        if (modelObj.name == modelName) {
            return modelObj.data_type == "PREFERENCE";
        }
    }
    return false;
}