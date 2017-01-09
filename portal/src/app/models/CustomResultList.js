import URLBuilder from './URLBuilder.js';
import {formatModelName} from '../models/Model.js';

export default class CustomResultList {
    constructor(customSequenceList, finishedLoading, showError) {
        this.urlBuilder = new URLBuilder($.ajax);
        this.customSequenceList = customSequenceList
        this.showError = showError;
        this.finishedLoading = finishedLoading;
        this.pendingFetchList = [];
        this.resultList = [];
        this.errors = [];
    }
    
    fetch() {
        let pendingErrors = this.errors;
        this.resultList = [];
        this.pendingFetchList = [];
        this.errors = [];
        if (this.customSequenceList.isEmpty()) {
            this.finishedLoading(pendingErrors);
        } else {
            for (let customSequence of this.customSequenceList.get()) {
                this.pendingFetchList.push(customSequence);
            }
            this._fetchNext();
        }
    }

    _fetchNext() {
        if (this.pendingFetchList.length == 0) {
            let pendingErrors = this.errors;
            this.errors = [];
            this.finishedLoading(pendingErrors);
            return;
        }
        let customSequence = this.pendingFetchList.pop();
        let urlBuilder = this.urlBuilder;
        urlBuilder.reset('api/v1/custom_predictions/find_for_sequence');
        urlBuilder.appendParam('sequence_id', customSequence.id)
        urlBuilder.fetch(function (data) {
            for (let item of data.results) {
                item['title'] = this.makeResultTitle(item.modelName, customSequence.title);
                this.resultList.push(item);
            }
            this._fetchNext();
        }.bind(this), function (error) {
            this.onError(error);
        }.bind(this), 'GET');
    }

    onError(errorDetails) {
        this.errors.push(errorDetails.message);
        this._fetchNext();
    }

    add(model, sequenceId, resultId) {
        let sequenceTitle = this.customSequenceList.lookup(sequenceId).title;
        let item = {
           title: this.makeResultTitle(model, sequenceTitle),
           modelName: model,
           sequenceId: sequenceId,
           resultId: resultId
        };
        this.resultList.push(item);
    }

    makeResultTitle(model, sequenceTitle) {
        return formatModelName(model) + ': ' + sequenceTitle;
    }

    get() {
        return this.resultList;
    }

}
