import URLBuilder from './URLBuilder.js';

export class CustomSequence {
    constructor(data, title) {
        this.data = data;
        this.title = title;
    }

    upload(onData, onError) {
        let title = this.title;
        let urlBuilder = new URLBuilder($.ajax);
        urlBuilder.reset('api/v1/sequences');
        urlBuilder.addToData('data', btoa(this.data));
        urlBuilder.addToData('title', title);
        urlBuilder.fetch(function(data) {
            onData(data.id, title);
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

    add(seqId, title) {
        console.log(title);
        this.list.push({
            id: seqId,
            title: title
        });
        localStorage.setItem(CUSTOM_SEQ_LIST_NAME, JSON.stringify(this.list));
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