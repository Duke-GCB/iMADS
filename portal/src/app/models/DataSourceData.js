import {getAndLogErrorMessage} from './AjaxErrorMessage.js'
import {URL} from './AppSettings.js'

const BINDING_PREDICTIONS_NAME = 'binding_predictions';
const PREFERENCE_PREDITIONS_NAME = 'preference_predictions';
const GENELIST_NAME = 'genelist';
const MODEL_NAME = 'model';

class DataSourceData {
    fetchData(onData, onError) {
        $.ajax({
            url: URL.datasources,
            dataType: 'json',
            type: 'GET',
            cache: false,
            success: function (data) {
                let results = data.results;
                onData(
                    this.formatData(BINDING_PREDICTIONS_NAME, results),
                    this.formatData(PREFERENCE_PREDITIONS_NAME, results),
                    this.formatData(GENELIST_NAME, results),
                    this.formatData(MODEL_NAME, results)
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
            let {url, filename, host} = this.formatURLParts(data.url);
            let row = {
                description: data.description,
                downloaded: data.downloaded,
                url: url,
                filename: filename,
                host: host,
                groupName: data.group_name,
            };
            rows.push(row);
        }
        return rows;
    }

    formatURLParts(url) {
        // Returns object with formatted url, filename, and host properties.
        // Adds https protocol to url if no protocol specified.
        if (url.indexOf('http') < 0 && url.indexOf('ftp') < 0) {
            url = 'https://' + url;
        }
        let filename = url.replace(/.*\//, "");
        //strip protocol and path
        let host = url.replace(/^.*:\/\//, "").replace(/\/.*$/, "");
        return {
            url: url,
            filename: filename,
            host: host
        };
    }
}

export default DataSourceData;
