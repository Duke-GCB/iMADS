export function formatModelName(modelName) {
    return modelName.replace(/_.*/, '');
}

export function makeTitleForModelName(modelName, title) {
    return formatModelName(modelName) + " predictions for " + title;
}