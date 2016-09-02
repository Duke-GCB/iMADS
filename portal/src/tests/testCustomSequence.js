import {CustomSequenceList} from './../app/store/CustomSequence.js';
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
            list.add(1, "test");
            assert.equal(list.containsId(1), true);
            assert.equal(list.containsId(2), false);
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
