export function formatModelName(modelName) {
    return modelName.replace(/_[0-9]+/, '').replace(/_/g, ' ');
}

export function makeTitleForModelName(modelName, title) {
    let modelType = "predictions";
    if (modelName.indexOf("_vs_") != -1) {
        modelType = "preferences";
    }
    return formatModelName(modelName) + " " + modelType + " for " + title;
}