export function formatModelName(modelName) {
    // Remove unique model numbers and underscores from the model names.
    // eg. 'Elk1_0004_vs_Ets1_0005' -> 'Elk1 vs Ets1'
    return modelName.replace(/_[0-9]+/g, '').replace(/_/g, ' ');
}

export function makeTitleForModelName(modelName, title) {
    let modelType = "predictions";
    if (modelName.indexOf("_vs_") != -1) {
        modelType = "preferences";
    }
    return formatModelName(modelName) + " " + modelType + " for " + title;
}