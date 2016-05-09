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
                let errorMessage = getAndLogErrorMessage('fetching datasource data', xhr, status, err);
                onError(errorMessage);
            }.bind(this)
        });
    }

    formatData(dataSourceType, dataSource) {
        let rows = [];
        for (let i = 0; i < dataSource.length; i++) {
            let data = dataSource[i];
            if (data.dataSourceType !== dataSourceType) {
                continue;
            }
            let fullUrl = data.url;
            if (fullUrl.indexOf('http') < 0) {
                fullUrl = 'http://' + fullUrl;
            }
            let cleanUrl = data.url.replace("https:\/\/", "").replace("http:\/\/", "");
            let row = {
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
