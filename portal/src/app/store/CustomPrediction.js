import {URL} from './AppSettings.js'
import {isCustomList, CUSTOM_GENE_LIST} from '../store/CustomList.js'
import StreamValue from './StreamValue.js'
import URLBuilder from './URLBuilder.js'

const GENE_NAMES_WARNING_PREFIX = "Gene names not in our database";

class CustomPrediction {
    constructor(pageBatch, urlBuilder) {
        this.pageBatch = pageBatch;
        this.urlBuilder = urlBuilder;
        this.lastSearchSettingsStr = undefined;
    }

    checkSettings(searchSettings) {
        let canRun = true;
        let errorMessage = '';
        if (canRun) {
            // We have a custom list with no data - we must prompt first.
            if (isCustomList(searchSettings.geneList)) {
                if (!searchSettings.customListData) {
                    canRun = false;
                }
            }
        }
        return {
            canRun: canRun,
            errorMessage: errorMessage
        };
    }

    createSettingsFromQueryParams(query) {
        let settings = {};
        if (query.genome) {
            settings = {
                geneList: query.geneList,
                model: query.model,
                all: this.isStrTrue(query.all),
                maxPredictionSort: this.isStrTrue(query.maxPredictionSort),
                showCustomDialog: false,
                customListData: query.customListData,
            };
        }
        let customList = isCustomList(settings.geneList);
        let hasCustomListData = Boolean(settings.customListData);
        return {
            searchSettings: settings,
            customListWithoutData: customList && !hasCustomListData
        };
    }

    isStrTrue(val) {
        return val === 'true'
    }

    requestPage(pageNum, searchSettings, onData, onError) {
        this.saveSearchSettings(searchSettings);
        if (this.pageBatch.hasPage(pageNum)) {
            onData(this.pageBatch.getItems(pageNum), pageNum, true, '');
        } else {
            let batchPage = this.pageBatch.getBatchPageNum(pageNum)
            let itemsPerBatch = this.pageBatch.getItemsPerBatch();
            this.setBuilderURL(batchPage, itemsPerBatch, searchSettings);
            this.urlBuilder.fetch(function(data) {
                if (pageNum == -1) {
                    batchPage = data.page;
                }
                this.pageBatch.setItems(batchPage, data.predictions, true);
                if (pageNum == -1) {
                    pageNum = this.pageBatch.getEndPage();
                }
                onData(this.pageBatch.getItems(pageNum), pageNum, true, data.warning);
            }.bind(this), onError);
        }
    }

    saveSearchSettings(searchSettings) {
        let searchSettingsStr = JSON.stringify(searchSettings);
        if (this.lastSearchSettingsStr && searchSettingsStr !== this.lastSearchSettingsStr) {
            this.pageBatch.clearData();
        }
        this.lastSearchSettingsStr = searchSettingsStr;
    }

    setBuilderURL(page, perPage, searchSettings) {
        let urlBuilder = this.urlBuilder;
        urlBuilder.reset(URL.genomes + '/');
        urlBuilder.append(searchSettings.genome);
        urlBuilder.append('/prediction');
        urlBuilder.appendParam('protein', searchSettings.model);
        urlBuilder.appendParam('geneList', searchSettings.geneList);
        urlBuilder.appendParam('customListData', searchSettings.customListData);
        urlBuilder.appendParam('customListFilter', searchSettings.customListFilter, true);
        if (searchSettings.geneList === CUSTOM_GENE_LIST) {
            urlBuilder.appendParam('customGeneSearchType', searchSettings.customGeneSearchType);
        }
        urlBuilder.appendParam('upstream', searchSettings.upstream);
        urlBuilder.appendParam('downstream', searchSettings.downstream);
        urlBuilder.appendParam('includeAll', searchSettings.all);
        urlBuilder.appendParam('maxPredictionSort', searchSettings.maxPredictionSort);
        if (page && perPage) {
            urlBuilder.appendParam('page', page);
            urlBuilder.appendParam('perPage', perPage);
        }
    }

    getDownloadURL(format, searchSettings) {
        this.setBuilderURL(undefined, undefined, searchSettings)
        this.urlBuilder.appendParam('format',format);
        return this.urlBuilder.url;
    }

    makeLocalUrl(searchSettings) {
        let urlBuilder = new URLBuilder();
        urlBuilder.reset('');
        urlBuilder.appendParam('genome', searchSettings.genome);
        urlBuilder.appendParam('model', searchSettings.model);
        urlBuilder.appendParam('geneList', searchSettings.geneList);
        urlBuilder.appendParam('upstream', searchSettings.upstream);
        urlBuilder.appendParam('downstream', searchSettings.downstream);
        urlBuilder.appendParam('all', searchSettings.all);
        urlBuilder.appendParam('maxPredictionSort', searchSettings.maxPredictionSort);
        urlBuilder.appendParam('customListFilter', searchSettings.customListFilter, true);
        urlBuilder.appendParam('customListData', searchSettings.customListData, true);
        if (searchSettings.geneList === CUSTOM_GENE_LIST) {
            urlBuilder.appendParam('customGeneSearchType', searchSettings.customGeneSearchType);
        }
        return urlBuilder.url;
    }

    isGeneWarningMessage(message) {
        return message.startsWith(GENE_NAMES_WARNING_PREFIX);
    }

}

export default CustomPrediction;