class URLBuilder {
    constructor(fetchMethod) {
        this.fetchMethod = fetchMethod;
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

    appendParam(name, value) {
        var prefix = '?';
        if (this.hasParam) {
            var prefix = '&';
        }
        this.url += prefix + name + "=" + value;
        this.hasParam = true;
    }

    fetch(onData, onError, method = 'POST', dataType = 'json') {
        var url = this.url;
        this.fetchMethod({
            url: url,
            type: method,
            contentType: "application/json; charset=utf-8",
            dataType: dataType,
            cache: false,
            data: JSON.stringify(this.data),
            success: function (data) {
                onData(data);
            },
            error: function (xhr, status, err) {
                var errorMessage = err;
                if (xhr.responseJSON) {
                    errorMessage = xhr.responseJSON.message;
                }
                onError({
                    url: url,
                    status: status,
                    message: errorMessage,
                });
            }
        });
    }
}

export default URLBuilder;