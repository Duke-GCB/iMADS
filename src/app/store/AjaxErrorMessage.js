export function getAndLogErrorMessage(activityStr, xhr, status, err) {
    var errorMsg = err;
    if (xhr.responseJSON) {
        errorMsg = xhr.responseJSON.message;
    }
    let message = 'Error ' + activityStr + ': ' + errorMsg;
    console.log(message);
    return message;
}
