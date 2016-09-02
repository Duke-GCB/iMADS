import {getAndLogErrorMessage} from './AjaxErrorMessage.js'

class URLBuilder {
    constructor(fetchMethod) {
        this.fetchMethod = fetchMethod || $.ajax;
        this.url = ''
        this.hasParam = false;
        this.data = {};
    }

    addToData(key, value) {
        this.data[key] = value;
    }

    reset(baseURL) {
        this.url = baseURL
        this.hasParam = false;
    }

    append(part) {
        this.url += part;
    }

    appendParam(name, value, skipIfEmpty=false) {
        if (skipIfEmpty && !value) {
            return;
        }
        let prefix = '?';
        if (this.hasParam) {
            prefix = '&';
        }
        this.url += prefix + name + "=" + value;
        this.hasParam = true;
    }

    fetch(onData, onError, method = 'POST', dataType = 'json') {
        let url = this.url;
        let data = this.data;
        if (method != 'GET') {
            data = JSON.stringify(this.data);
        }
        this.fetchMethod({
            url: url,
            type: method,
            contentType: "application/json; charset=utf-8",
            dataType: dataType,
            cache: false,
            data: data,
            success: function (data) {
                onData(data);
            },
            error: function (xhr, status, err) {
                let errorMessage = getAndLogErrorMessage('fetching data', xhr, status, err);
                onError({
                    url: url,
                    status: status,
                    message: errorMessage,
                    response: xhr.responseJSON,
                });
            }
        });
    }
}

export default URLBuilder;