
class PredictionsStore {
    constructor(pageBatch, urlBuilder) {
        this.pageBatch = pageBatch;
        this.urlBuilder = urlBuilder;
        this.lastSearchSettingsStr = undefined;
    }

    requestPage(pageNum, searchSettings, onData, onError) {
        this.saveSearchSettings(searchSettings);
        if (this.pageBatch.hasPage(pageNum)) {
            onData(this.pageBatch.getItems(pageNum), pageNum, true);
        } else {
            var batchPage = this.pageBatch.getBatchPageNum(pageNum)
            var itemsPerBatch = this.pageBatch.getItemsPerBatch();
            this.setBuilderURL(batchPage, itemsPerBatch, searchSettings);
            this.urlBuilder.fetch(function(data) {
                if (pageNum == -1) {
                    batchPage = data.page;
                }
                this.pageBatch.setItems(batchPage, data.predictions, true);
                if (pageNum == -1) {
                    pageNum = this.pageBatch.getEndPage();
                }
                onData(this.pageBatch.getItems(pageNum), pageNum, true);
            }.bind(this), onError);
        }
    }

    saveSearchSettings(searchSettings) {
        var searchSettingsStr = JSON.stringify(searchSettings);
        if (this.lastSearchSettingsStr && searchSettingsStr !== this.lastSearchSettingsStr) {
            this.pageBatch.clearData();
        }
        this.lastSearchSettingsStr = searchSettingsStr;
    }

    setBuilderURL(page, perPage, searchSettings) {
        var urlBuilder = this.urlBuilder;
        urlBuilder.reset('/api/v1/genomes/');
        urlBuilder.append(searchSettings.genome);
        urlBuilder.append('/prediction');
        urlBuilder.appendParam('protein', searchSettings.model);
        urlBuilder.appendParam('gene_list', searchSettings.gene_list);
        urlBuilder.appendParam('upstream', searchSettings.upstream);
        urlBuilder.appendParam('downstream', searchSettings.downstream);
        urlBuilder.appendParam('include_all', searchSettings.all);
        urlBuilder.appendParam('max_prediction_sort', searchSettings.maxPredictionSort);
        if (searchSettings.maxPredictionSort) {
            urlBuilder.appendParam('max_prediction_guess', '0.4');
        }
        urlBuilder.appendParam('page', page);
        urlBuilder.appendParam('per_page', perPage);
    }
}

export default PredictionsStore;