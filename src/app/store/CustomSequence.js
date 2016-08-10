import URLBuilder from './URLBuilder.js';

export class CustomSequence {
    upload(data, title, onData, onError) {
        let urlBuilder = new URLBuilder($.ajax);
        urlBuilder.reset('api/v1/sequences');
        urlBuilder.addToData('data', btoa(data));
        urlBuilder.addToData('title', title);
        urlBuilder.fetch(function(data) {
            onData(data.id, title);
        }.bind(this), function(data) {
            onError(data.message);
        }.bind(this));
    }

    fetch(sequenceId, onData, onError) {
        let urlBuilder = new URLBuilder($.ajax);
        urlBuilder.reset('api/v1/sequences/' + sequenceId);
        urlBuilder.fetch(function(data) {
            onData(data);
        }.bind(this), function(data) {
            onError(data.message);
        }.bind(this), 'GET');
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

    add(seqId, title) {
        console.log(title);
        this.list.push({
            id: seqId,
            title: title
        });
        this.saveChanges();
    }

    saveChanges() {
        localStorage.setItem(CUSTOM_SEQ_LIST_NAME, JSON.stringify(this.list));
    }

    containsId(seqId) {
        for (let item of this.list) {
            if (item.id == seqId) {
                return true;
            }
        }
        return false;
    }

    replace(seqId, title, oldSeqId) {
        for (let i = 0; i < this.list.length; i++) {
            let item = this.list[i];
            if (item.id == oldSeqId) {
                this.list[i] = {
                    id: seqId,
                    title: title
                };
                this.saveChanges();
                break;
            }
        }
    }

    addIfNecessary(id) {
        for (let item of this.list) {
            if (item.id == id) {
                return;
            }
        }
        this.add(id, 'Custom Sequence');
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
        return this.list[0].id;
    }


}