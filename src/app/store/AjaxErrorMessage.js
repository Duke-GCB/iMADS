export function getAndLogErrorMessage(activityStr, xhr, status, err) {
    let errorMsg = err;
    if (xhr.responseJSON) {
        errorMsg = xhr.responseJSON.message;
    }
    let message = 'Error ' + activityStr + ': ' + errorMsg;
    console.log(message);
    return message;
}
