import HeatMapData, {OverlappingList} from './../app/models/HeatMapData.js';
var assert = require('chai').assert;

describe('OverlappingList', function () {
    describe('itemsOverlap()', function () {
        it('return false for non-overlapping items', function () {
            var item1 = {start:1,end:5};
            var item2 = {start:6,end:10};
            assert.equal(false, OverlappingList.itemsOverlap(item1, item2));
            assert.equal(false, OverlappingList.itemsOverlap(item2, item1));
        });
       it('return false for almost-overlapping items', function () {
            var item1 = {start:1,end:5};
            var item2 = {start:5,end:10};
            assert.equal(false, OverlappingList.itemsOverlap(item1, item2));
            assert.equal(false, OverlappingList.itemsOverlap(item2, item1));
        });
       it('return true for overlapping items', function () {
            var item1 = {start:1,end:5};
            var item2 = {start:4,end:10};
            assert.equal(true, OverlappingList.itemsOverlap(item1, item2));
            assert.equal(true, OverlappingList.itemsOverlap(item2, item1));
        });
    });

    describe('flatten()', function () {
        it('add two separate', function () {
            let overlappingList = new OverlappingList();
            overlappingList.add({start:1,end:5});
            overlappingList.add({start:6,end:10});
            let flattened = overlappingList.flatten();
            assert.equal(flattened.length, 2);
            let flattenedStr = OverlappingList.itemAryToString(flattened);
            assert.include(flattenedStr, '[1,5 children_len:1]');
            assert.include(flattenedStr, '[6,10 children_len:1]');
        });
        it('add two separate then combine both for a third that overlaps', function () {
            let overlappingList = new OverlappingList();
            overlappingList.add({start:1,end:5});
            overlappingList.add({start:6,end:10});
            overlappingList.add({start:4,end:7});
            let flattened = overlappingList.flatten();
            assert.equal(flattened.length, 3);
            let flattenedStr = OverlappingList.itemAryToString(flattened);
            assert.include(flattenedStr, '[1,5 children_len:2]');
            assert.include(flattenedStr, '[6,10 children_len:2]');
            assert.include(flattenedStr, '[4,7 children_len:3]');
        });
        it('add two separate then combine both for a third that overlaps first', function () {
            let overlappingList = new OverlappingList();
            overlappingList.add({start:1,end:5});
            overlappingList.add({start:7,end:10});
            overlappingList.add({start:4,end:7});
            let flattened = overlappingList.flatten();
            assert.equal(flattened.length, 3);
            let flattenedStr = OverlappingList.itemAryToString(flattened);
            assert.include(flattenedStr, '[1,5 children_len:2]');
            assert.include(flattenedStr, '[4,7 children_len:2]');
            assert.include(flattenedStr, '[7,10 children_len:1]');
        });
        it('real world example', function () {
            let overlappingList = new OverlappingList();
            overlappingList.add({start:40,end:66, value:1});
            overlappingList.add({start:67,end:93, value:2});
            overlappingList.add({start:28,end:54, value:-3});
            overlappingList.add({start:36,end:62, value:-4});
            let flattened = overlappingList.flatten();
            assert.equal(flattened.length, 4);
            let flattenedStr = OverlappingList.itemAryToString(flattened);
            assert.include(flattenedStr, '[40,66 children_len:3]');
            assert.include(flattenedStr, '[67,93 children_len:1]');
            assert.include(flattenedStr, '[28,54 children_len:3]');
            assert.include(flattenedStr, '[36,62 children_len:3]');
        });
    });
});
