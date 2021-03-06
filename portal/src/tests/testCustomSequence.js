import {CustomSequenceList} from './../app/models/CustomSequence.js';
var assert = require('chai').assert;

class FakeLocalStorage {
    load() {
        return [];
    }
    save(values) {
        
    }
}

describe('CustomSequenceList', function () {
    describe('containsId()', function () {
        it('should be able find added items', function () {
            let list = new CustomSequenceList(new FakeLocalStorage());
            assert.equal(list.containsId(1), false);
            list.add(1, "test", "Elk1_0004");
            assert.equal(list.containsId(1), true);
            assert.equal(list.containsId(2), false);
            assert.equal(1, list.getFirst().id);
            assert.equal("Elk1_0004", list.getFirst().model);
        });
    });
    describe('isTitleDuplicate()', function () {
        it('should be able determine if a title is a duplicate', function () {
            let list = new CustomSequenceList(new FakeLocalStorage());
            assert.equal(list.isTitleDuplicate(1, "test"), false);
            list.add(1, "test");
            assert.equal(list.isTitleDuplicate(2, "test"), true);
            assert.equal(list.isTitleDuplicate(2, "test2"), false);
            //you can replace yourself
            assert.equal(list.isTitleDuplicate(1, "test"), false);
        });
    });
});
