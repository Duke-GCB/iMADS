import {URL} from './AppSettings.js'
import {isCustomList, CUSTOM_GENE_LIST, CUSTOM_RANGES_LIST} from './CustomList.js'
import StreamValue from './StreamValue.js'
import URLBuilder from './URLBuilder.js'
import {GeneNameColumnFormats, CustomRangeColumnFormats, COLUMN_FORMAT_NUMERIC_BINDING_SITES,
    COLUMN_FORMAT_BINDING_SITES_LIST} from './ColumnFormats.js'
const GENE_NAMES_WARNING_PREFIX = "Gene names not in our database";

class PredictionsStore {
    constructor(pageBatch, urlBuilder) {
        this.pageBatch = pageBatch;
        this.urlBuilder = urlBuilder;
        this.lastSearchSettingsStr = undefined;
    }

    checkSettings(searchSettings, maxBindingOffset) {
        let canRun = true;
        let errorMessage = '';
        // We don't have a genome version - we must waiting for settings to load.
        if (!searchSettings.genome) {
            canRun = false;
        }
        if (canRun) {
            // We have a custom list with no data - we must prompt first.
            if (isCustomList(searchSettings.geneList)) {
                if (!searchSettings.customListData) {
                    canRun = false;
                }
            }
        }
        if (canRun) {
            // User has entered bad upstream or downstream values.
            let streamValue = new StreamValue(maxBindingOffset);
            let upstreamError = streamValue.checkForError("Bases upstream", searchSettings.upstream);
            let downstreamError = streamValue.checkForError("Bases downstream", searchSettings.downstream);
            if (upstreamError || downstreamError) {
                errorMessage = upstreamError;
                if (!errorMessage) {
                    errorMessage = downstreamError;
                }
                canRun = false;
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
                genome: query.genome,
                geneList: query.geneList,
                model: query.model,
                all: this.isStrTrue(query.all),
                upstream: query.upstream,
                upstreamValid: true,
                downstream: query.downstream,
                downstreamValid: true,
                maxPredictionSort: this.isStrTrue(query.maxPredictionSort),
                showCustomDialog: false,
                customListData: query.customListData,
                customListFilter: query.customListFilter,
                customGeneSearchType: query.customGeneSearchType,
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

    getDownloadColumnFormats(searchSettings) {
        if (searchSettings.geneList === CUSTOM_RANGES_LIST) {
            return CustomRangeColumnFormats();
        } else {
            return GeneNameColumnFormats();
        }
    }

    getDownloadURL(fieldSeparator, columnFormatName, searchSettings) {
        var settings = Object.assign({}, searchSettings);
        const includeAll = columnFormatName === COLUMN_FORMAT_NUMERIC_BINDING_SITES ? 'true' : '';
        const bindingSiteList = columnFormatName === COLUMN_FORMAT_BINDING_SITES_LIST ? 'true' : '';
        settings.all = includeAll;
        this.setBuilderURL(undefined, undefined, settings);
        this.urlBuilder.appendParam('format', fieldSeparator);
        this.urlBuilder.appendParam('bindingSiteList', bindingSiteList);
        return this.urlBuilder.url;
    }

}

export default PredictionsStore;
