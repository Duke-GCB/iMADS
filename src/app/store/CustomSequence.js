import URLBuilder from './URLBuilder.js';

export class CustomSequence {
    constructor(data) {
        this.data = data;
    }

    upload(onData, onError) {
        let urlBuilder = new URLBuilder($.ajax);
        urlBuilder.reset('api/v1/sequences');
        urlBuilder.addToData('data', btoa(this.data));
        urlBuilder.fetch(function(data) {
            onData(data.id);
        }.bind(this), function(data) {
            onError(data.message);
        }.bind(this));
    }

}

const CUSTOM_SEQ_LIST_NAME = "customSequenceList";

export class CustomSequenceList {
    constructor() {
        let list = JSON.parse(localStorage.getItem(CUSTOM_SEQ_LIST_NAME));
        if (list == null) {
            list = [];
        }
        this.list = list;
    }

    add(seqId) {
        this.list.push(seqId);
        localStorage.setItem(CUSTOM_SEQ_LIST_NAME, JSON.stringify(this.list));
    }

    get() {
        return this.list;
    }

    isEmpty() {
        return this.list.length == 0;
    }

    getFirst() {
        if (this.isEmpty()) {
            return ''
        }
        return this.list[0];
    }
}