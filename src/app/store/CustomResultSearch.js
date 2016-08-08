import URLBuilder from './URLBuilder.js';

const STATUS_MESSAGES = {
    'NEW': 'Your predictions have been queued for processing.',
    'RUNNING': 'Your predictions are running.',
    'COMPLETE': 'Your predictions are ready.',
    'ERROR': 'Error:'
}

class CustomResultSearch {
    constructor(statusLabelObj) {
        this.urlBuilder = new URLBuilder($.ajax);
        this.resultIdCache = new ResultIdCache();
        this.currentRequest = {}
        this.statusLabelObj = statusLabelObj;
        this.setStatusLabel = this.setStatusLabel.bind(this);
        this.log = console.log
        this.active = true;
    }

    cancel() {
        this.active = false;
    }

    showError(message) {
        if (this.currentRequest) {
            this.currentRequest.onError({
                message: message
            })
        } else {
            alert(message);
        }
    }
    
    setStatusLabel(label) {
        this.statusLabelObj.setLoadingStatusLabel(label);
    }

    requestPage(page, predictionSettings, onSearchData, onError) {
        if (this.currentRequest) {
            if (page == this.currentRequest.page &&
                    predictionSettings == this.currentRequest.predictionSettings) {
                this.log("CustomResultSearch requestPage is being spammed.")
                return;
            }
        }
        this.currentRequest = {
            page: page,
            predictionSettings: predictionSettings,
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
        this.log("Perform search for" + resultId + ".");
        let urlBuilder = this.urlBuilder;
        urlBuilder.reset('api/v1/custom_predictions/' + resultId + "/search");
        urlBuilder.addToData('maxPredictionSort', this.currentRequest.predictionSettings.maxPredictionSort);
        urlBuilder.addToData('page', 1);
        urlBuilder.addToData('per_page', 20);
        urlBuilder.fetch(function (data) {
            this.currentRequest.onSearchData(data.result);
        }.bind(this), function (error) {
            this.showError(error.message);
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
                this.fetchResult(resultId);
            } else {
                if (mustExist) {
                    this.showError("Error: Job database wrong. Job at COMPLETE status with no results found.");
                } else {
                    this.log("Missing result for " + model + " and " + sequenceId + ".");
                    this.createJob(model, sequenceId);
                }
            }
        }.bind(this), function (error) {
            this.showError(error.message);
        }.bind(this));
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
                this.waitForJob(jobId);
            } else {
                console.log("Failed to create job.");
            }
        }.bind(this), function (error) {
            this.showError(error.message);
        }.bind(this));
    }

    waitForJob = (jobId) => {
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
                        this.showError(message);
                    } else {
                        this.setStatusLabel(message);
                        this.log("Waiting and checking " + jobId + " again.");
                        window.setTimeout(this.waitForJob, 1000, jobId);
                    }
                }
            }
        }.bind(this), function (error) {
            this.showError(error.message);
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
        dict[sequence] = resultId
    }
}

///api/v1/custom_predictions/find_one

export default CustomResultSearch;