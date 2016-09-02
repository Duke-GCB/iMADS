
export const GENERIC_ERROR = 'generic';
export const SEQUENCE_NOT_FOUND = 'sequence_not_found';

export function makeErrorObject(error) {
    let response = error.response || {};
    return {
        message: error.message,
        errorType: response['error_type'],
        errorData: response['error_data'],
    }
}