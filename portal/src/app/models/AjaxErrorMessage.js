export function getAndLogErrorMessage(activityStr, xhr, status, err) {
    let errorMsg = err;
    if (xhr.responseJSON) {
        errorMsg = xhr.responseJSON.message;
    }
    let message = errorMsg;
    console.log(message + "(" + activityStr + " )");
    return message;
}
