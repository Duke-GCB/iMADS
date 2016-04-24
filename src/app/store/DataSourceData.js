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
                console.error(this.props.url, status, err.toString());
                onError('Error fetching datasources data' + err.toString());
            }.bind(this)
        });
    }

    formatData(data_source_type, data_source) {
        var rows = [];
        for (var i = 0; i < data_source.length; i++) {
            var data = data_source[i];
            if (data.data_source_type !== data_source_type) {
                continue;
            }
            var full_url = data.url;
            if (full_url.indexOf('http') === 0) {
                full_url = 'http://' + full_url;
            }
            var clean_url = data.url.replace("https:\/\/", "").replace("http:\/\/", "");
            var row = {
                description: data.description,
                downloaded: data.downloaded,
                fullUrl: full_url,
                cleanUrl: clean_url,
            };
            rows.push(row);
        }
        return rows;
    }
}

export default DataSourceData;