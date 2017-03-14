import URLBuilder from './URLBuilder.js';

const CUTOFF_MS = 58 * 60 * 60 * 1000; //58 hours

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

export class CustomSequenceStorage {
    load() {
        return JSON.parse(localStorage.getItem(CUSTOM_SEQ_LIST_NAME));
    }
    save(values) {
        localStorage.setItem(CUSTOM_SEQ_LIST_NAME, JSON.stringify(values));
    }
}

export class CustomSequenceList {
    constructor(storage) {
        this.storage = storage || new CustomSequenceStorage();
        let list = this.storage.load();
        if (list == null) {
            list = [];
        }
        this.list = list;
    }

    add(seqId, title) {
        this.list.push({
            id: seqId,
            title: title,
            createdMS: new Date().getTime()
        });
        this.saveChanges();
    }

    lookup(seqId) {
        for (let item of this.list) {
            if (item.id == seqId) {
                return item;
            }
        }
        return undefined;
    }

    saveChanges() {
        this.storage.save(this.list);
    }

    containsId(seqId) {
        for (let item of this.list) {
            if (item.id == seqId) {
                return true;
            }
        }
        return false;
    }

    isTitleDuplicate(seqId, title) {
        for (let item of this.list) {
            if (item.title == title && item.id != seqId) {
                return true;
            }
        }
        return false;
    }

    replace(seqId, title, oldSeqId) {
        for (let i = 0; i < this.list.length; i++) {
            let item = this.list[i];
            if (item.id == oldSeqId) {
                var previousSequence = Object.assign({}, this.list[i]);
                this.list[i] = {
                    id: seqId,
                    title: title,
                    createdMS: new Date().getTime(),
                    previousSequence: previousSequence
                };
                this.saveChanges();
                break;
            }
        }
    }

    remove(seqId) {
        for (let i = 0; i < this.list.length; i++) {
            let item = this.list[i];
            if (item.id == seqId) {
                if (item.previousSequence && item.previousSequence.id) {
                    this.list[i] = item.previousSequence;
                } else {
                    this.list.splice(i);
                }
                break;
            }
        }
        this.saveChanges();
    }

    /**
     * Remove any sequences older than 58 hours (the server retains them for 48 hours).
     */
    removeOld() {
        let newList = [];
        let currentMS = new Date().getTime();
        for (let item of this.list) {
            if (currentMS - item.createdMS <= CUTOFF_MS) {
                newList.push(item);
            }
        }
        this.list = newList;
        this.saveChanges();
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
