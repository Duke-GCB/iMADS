
MAX_UPLOAD_DATA_SIZE = 20 * 1024 * 1024
MAX_UPLOAD_DATA_SIZE_STR = "20MB"


class ErrorType(object):
    GENERIC_ERROR = 'generic'
    SEQUENCE_NOT_FOUND = 'sequence_not_found'
    INVALID_SEQUENCE_DATA = 'invalid_sequence_data'
    INVALID_SEQUENCE_ID = 'invalid_sequence_id'
    UPLOADED_DATA_TOO_BIG = 'uploaded_data_too_big'


class BaseWebException(Exception):
    def __init__(self, message, error_type, error_data, status_code):
        self.message = message
        self.error_type = error_type
        self.error_data = error_data
        self.status_code = status_code

    def json_response(self, response_builder_func):
        response = response_builder_func({
            'result': 'ERROR',
            'message': self.message,
            'error_type': self.error_type,
            'error_data': self.error_data
        })
        response.status_code = self.status_code
        return response


class ClientException(BaseWebException):
    """
    Exception that is a problem with the data sent by the client.
    """
    def __init__(self, message, error_type, error_data='', status_code=400):
        self.message = message
        self.error_type = error_type
        self.error_data = error_data
        self.status_code = status_code


class ServerException(BaseWebException):
    """
    Exception that is a problem with this server.
    """
    def __init__(self, message, error_type, error_data='', status_code=500):
        self.message = message
        self.error_type = error_type
        self.error_data = error_data
        self.status_code = status_code


def raise_on_too_big_uploaded_data(data):
    if len(data) >= MAX_UPLOAD_DATA_SIZE:
        message = "Content too big max {}".format(MAX_UPLOAD_DATA_SIZE_STR)
        raise ClientException(message, ErrorType.UPLOADED_DATA_TOO_BIG)
