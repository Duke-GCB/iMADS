import {getAndLogErrorMessage} from './AjaxErrorMessage.js'

const ENDPOINT = '/api/v1/datasources';
const PREDICTION_NAME = 'prediction';
const GENELIST_NAME = 'genelist';

class DataSourceData {
    fetchData(onData, onError) {
        $.ajax({
            url: ENDPOINT,
            dataType: 'json',
            type: 'GET',
            cache: false,
            success: function (data) {
                let results = data.results;
                onData(
                    this.formatData(PREDICTION_NAME, results),
                    this.formatData(GENELIST_NAME, results)
                );
            }.bind(this),
            error: function (xhr, status, err) {
                var errorMessage = getAndLogErrorMessage('fetching datasource data', xhr, status, err);
                onError(errorMessage);
            }.bind(this)
        });
    }

    formatData(dataSourceType, dataSource) {
        var rows = [];
        for (var i = 0; i < dataSource.length; i++) {
            var data = dataSource[i];
            if (data.dataSourceType !== dataSourceType) {
                continue;
            }
            var fullUrl = data.url;
            if (fullUrl.indexOf('http') < 0) {
                fullUrl = 'http://' + fullUrl;
            }
            var cleanUrl = data.url.replace("https:\/\/", "").replace("http:\/\/", "");
            var row = {
                description: data.description,
                downloaded: data.downloaded,
                fullUrl: fullUrl,
                cleanUrl: cleanUrl,
            };
            rows.push(row);
        }
        return rows;
    }
}

export default DataSourceData;
