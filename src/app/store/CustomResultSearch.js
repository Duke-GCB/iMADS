import URLBuilder from './URLBuilder.js';
import {makeErrorObject} from './Errors.js';

const STATUS_MESSAGES = {
    'NEW': 'Your predictions have been queued for processing.',
    'RUNNING': 'Your predictions are running.',
    'COMPLETE': 'Your predictions are ready.',
    'ERROR': 'Error:'
};

//onSearchData(predictions, pageNum, hasNextPages, warning)

class CustomResultSearch {
    constructor(statusLabelObj, pageBatch) {
        this.urlBuilder = new URLBuilder($.ajax);
        this.resultIdCache = new ResultIdCache();
        this.currentRequest = {};
        this.statusLabelObj = statusLabelObj;
        this.setStatusLabel = this.setStatusLabel.bind(this);
        this.log = (str) => (console.log(str));
        this.active = true;
        this.currentJobId = 0;
        this.pageBatch = pageBatch;
        this.lastResultId = undefined;
    }

    cancel() {
        this.active = false;
    }

    showError(error) {
        if (this.currentRequest) {
            this.currentRequest.onError(makeErrorObject(error));
        } else {
            alert(error.message);
        }
    }
    
    setStatusLabel(label) {
        this.statusLabelObj.setLoadingStatusLabel(label);
    }

    requestPage(page, predictionSettings, onSearchData, onError) {
        let sameSettingsAsLastTime = JSON.stringify(this.currentRequest.predictionSettings) == JSON.stringify(predictionSettings);
        if (sameSettingsAsLastTime) {
            if (this.pageBatch.hasPage(page)) {
                let predictions = this.pageBatch.getItems(page);
                onSearchData(predictions, page, true, '');
                return;
            }
        }
        if (this.currentRequest) {
            if (page == this.currentRequest.page && sameSettingsAsLastTime) {
                this.log("CustomResultSearch requestPage debounce.")
                return;
            }
        }
        let currentPredictionSettings = {};
        Object.assign(currentPredictionSettings, predictionSettings);
        this.currentRequest = {
            page: page,
            predictionSettings: currentPredictionSettings,
            onSearchData: onSearchData,
            onError: onError
        };
        let {model, selectedSequence} = predictionSettings;
        let resultId = this.resultIdCache.getResultId(model, selectedSequence);
        if (resultId) {
            this.log("Found resultId from result cache:" + resultId);
            this.fetchResult(resultId);
        } else {
            this.log("Looking for result for " + model + " , " + selectedSequence + " at remote server.");
            this.findResult(model, selectedSequence, false);
        }
    }

    fetchResult(resultId) {
        this.lastResultId = resultId;
        this.currentJobId = 0;
        this.log("Perform search for" + resultId + ".");
        let pageNum = this.currentRequest.page;
        let urlBuilder = this.urlBuilder;
        urlBuilder.reset('api/v1/custom_predictions/' + resultId + "/search");
        urlBuilder.addToData('maxPredictionSort', this.currentRequest.predictionSettings.maxPredictionSort);
        urlBuilder.addToData('page', this.pageBatch.getBatchPageNum(pageNum));
        urlBuilder.addToData('per_page', this.pageBatch.getItemsPerBatch());
        urlBuilder.fetch(function (data) {
            let batchPage = this.pageBatch.getBatchPageNum(pageNum)
            this.pageBatch.setItems(batchPage, data.result, true);
            if (pageNum == -1) {
                pageNum = this.pageBatch.getEndPage();
            }
            this.currentRequest.onSearchData(this.pageBatch.getItems(pageNum), pageNum, true, data.warning);

            // delay so user can see the progress indicator
            //window.setTimeout(this.currentRequest.onSearchData, 300, data.result);
        }.bind(this), function (error) {
            this.showError(error);
        }.bind(this), 'GET');
    }

    findResult(model, sequenceId, mustExist) {
        let urlBuilder = this.urlBuilder;
        urlBuilder.reset('api/v1/custom_predictions/find_one');
        urlBuilder.addToData('model_name', model);
        urlBuilder.addToData('sequence_id', sequenceId);
        urlBuilder.fetch(function (data) {
            let resultId = data.id;
            if (resultId) {
                this.log("Got result for " + model + " and " + sequenceId + ".");
                this.resultIdCache.saveResultId(model, sequenceId, resultId);
                this.fetchResult(resultId);
            } else {
                if (mustExist) {
                    // job COMPLETED without any data
                    this.currentRequest.onSearchData([], 1);
                } else {
                    this.log("Missing result for " + model + " and " + sequenceId + ".");
                    this.createJob(model, sequenceId);
                }
            }
        }.bind(this), function (error) {
            this.showError(error);
        }.bind(this), 'GET');
    }

    createJob(model, sequenceId) {
        let urlBuilder = this.urlBuilder;
        urlBuilder.reset('api/v1/jobs');
        urlBuilder.addToData('job_type', 'PREDICTION');
        urlBuilder.addToData('model_name', model);
        urlBuilder.addToData('sequence_id', sequenceId);
        urlBuilder.fetch(function (data) {
            let jobId = data.id;
            if (jobId) {
                this.currentJobId = jobId;
                this.waitForJob(jobId);
            } else {
                console.log("Failed to create job.");
            }
        }.bind(this), function (error) {
            this.showError(error);
        }.bind(this));
    }

    waitForJob = (jobId) => {
        // do not process previous job request that are no longer needed
        if (this.currentJobId != jobId) {
            return;
        }
        let urlBuilder = this.urlBuilder;
        urlBuilder.reset('api/v1/jobs/' + jobId);
        urlBuilder.fetch(function (data) {
            if (data.status == "COMPLETE") {
                this.log("Job " + jobId + " is complete.");
                let {model, selectedSequence} = this.currentRequest.predictionSettings;
                this.findResult(model, selectedSequence, true);
            } else {
                if (this.active) {
                    let message = this.getJobStatusMsg(data);
                    if (data.status == "ERROR") {
                        this.showError({'message': message});
                    } else {
                        this.setStatusLabel(message);
                        this.log("Waiting and checking " + jobId + " again.");
                        window.setTimeout(this.waitForJob, 1000, jobId);
                    }
                }
            }
        }.bind(this), function (error) {
            this.showError(error);
        }.bind(this), 'GET');
    }

    getJobStatusMsg(data) {
        let status = data.status;
        let message = STATUS_MESSAGES[status] || "Unknown";
        if (status == "ERROR") {
            return message + data['error_msg'];
        }
        return message;
    }

    makeLocalUrl(predictionSettings) {
        let settings = this.currentRequest.predictionSettings;
        let urlBuilder = new URLBuilder();
        urlBuilder.reset('/prediction');
        urlBuilder.appendParam('model', settings.model);
        urlBuilder.appendParam('selectedSequence', settings.selectedSequence);
        if (settings.all) {
            urlBuilder.appendParam('all', settings.all);
        }
        if (settings.maxPredictionSort) {
            urlBuilder.appendParam('maxPredictionSort', settings.maxPredictionSort);
        }
        return urlBuilder.url
    }

    makeSettingsFromQuery(query) {
        return {
            model: query.model,
            selectedSequence: query.selectedSequence,
            all: query.all,
            maxPredictionSort: query.maxPredictionSort,
        }
    }

    getDownloadURL(format, predictionSettings) {
        let urlBuilder = new URLBuilder();
        urlBuilder.reset('api/v1/custom_predictions/' + this.lastResultId + "/search");
        urlBuilder.appendParam('maxPredictionSort', predictionSettings.maxPredictionSort);
        urlBuilder.appendParam('all', predictionSettings.all);
        urlBuilder.appendParam('format', format);
        return urlBuilder.url;
    }

    getRawDownloadURL() {
        let urlBuilder = new URLBuilder();
        urlBuilder.reset('api/v1/custom_predictions/' + this.lastResultId + "/data");
        return urlBuilder.url;
    }
}

class ResultIdCache {
    constructor() {
        this._cache = {};
    }

    getResultId(model, sequence) {
        let dict = this._cache[model] || {};
        return dict[sequence];
    }

    saveResultId(model, sequence, resultId) {
        let dict = this._cache[model] || {};
        dict[sequence] = resultId;
        this._cache[model] = dict;
    }
}

export default CustomResultSearch;