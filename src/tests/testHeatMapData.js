import HeatMapData, {OverlappingList} from './../app/store/HeatMapData.js';
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

    describe('getUniqueIndexes()', function () {
        it('works for two non-overlapping children', function () {
            let indexes = OverlappingList.getUniqueIndexes([
                {start:1,end:5},
                {start:6,end:10}
            ]);
            assert.deepEqual(indexes, [1,5,6,10]);
        });
        it('works for two overlapping children', function () {
            let indexes = OverlappingList.getUniqueIndexes([
                {start:1,end:5},
                {start:3,end:10}
            ]);
            assert.deepEqual(indexes, [1,3,5,10]);
        });

        it('works for three overlapping children', function () {
            let indexes = OverlappingList.getUniqueIndexes([
                {start:1,end:20},
                {start:3,end:6},
                {start:7,end:10}
            ]);
            assert.deepEqual(indexes, [1,3,6,7,10,20]);
        });
        it('real world example', function () {
            let indexes = OverlappingList.getUniqueIndexes([
                {start:40,end:66, value:1},
                {start:67,end:93, value:2},
                {start:28,end:54, value:-3},
                {start:36,end:62, value:-4}]);
            assert.deepEqual(indexes, [28,36,40,54,62,66,67,93]);
        });
    });
    describe('makeUniqueGroupsForChildren()', function () {
        it('works for one child', function () {
            let children = [
                {start:1,end:5},
            ];
            let itemAry = OverlappingList.makeUniqueGroupsForChildren(children);
            let groupStr = OverlappingList.itemAryToString(itemAry);
            assert.include(groupStr, '[1,5 children_len:1]');
        });
        it('works for two children', function () {
            let children = [
                {start:1,end:5},
                {start:4,end:6},
            ];
            let itemAry = OverlappingList.makeUniqueGroupsForChildren(children);
            let groupStr = OverlappingList.itemAryToString(itemAry);
            assert.include(groupStr, '[1,4 children_len:1]');
            assert.include(groupStr, '[4,5 children_len:2]');
            assert.include(groupStr, '[5,6 children_len:1]');
        });

        it('works for three children', function () {
            let children = [
                {start:1,end:10},
                {start:3,end:4},
                {start:5,end:6},
            ];
            let itemAry = OverlappingList.makeUniqueGroupsForChildren(children);
            let groupStr = OverlappingList.itemAryToString(itemAry);
            assert.include(groupStr, '[1,3 children_len:1]');
            assert.include(groupStr, '[3,4 children_len:2]');
            assert.include(groupStr, '[5,6 children_len:2]');
            assert.include(groupStr, '[6,10 children_len:1]');
        });
        it('real world example', function () {
            let children = [
                {start:40,end:66, value:1},
                {start:67,end:93, value:2},
                {start:28,end:54, value:-3},
                {start:36,end:62, value:-4}];
            let itemAry = OverlappingList.makeUniqueGroupsForChildren(children);

            assert.equal(6, itemAry.length);
            let groupStr = OverlappingList.itemAryToString(itemAry);
            assert.include(groupStr, '[28,36 children_len:1]');
            assert.include(groupStr, '[36,40 children_len:2]');
            assert.include(groupStr, '[40,54 children_len:3]');
            assert.include(groupStr, '[54,62 children_len:2]');
            assert.include(groupStr, '[62,66 children_len:1]');
            assert.include(groupStr, '[67,93 children_len:1]');
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
            assert.equal(flattened.length, 5);
            let flattenedStr = OverlappingList.itemAryToString(flattened);
            assert.include(flattenedStr, '[1,4 children_len:1]');
            assert.include(flattenedStr, '[4,5 children_len:2]');
            assert.include(flattenedStr, '[5,6 children_len:1]');
            assert.include(flattenedStr, '[6,7 children_len:2]');
            assert.include(flattenedStr, '[7,10 children_len:1]');
        });
        it('add two separate then combine both for a third that overlaps first', function () {
            let overlappingList = new OverlappingList();
            overlappingList.add({start:1,end:5});
            overlappingList.add({start:7,end:10});
            overlappingList.add({start:4,end:7});
            let flattened = overlappingList.flatten();
            assert.equal(flattened.length, 4);
            let flattenedStr = OverlappingList.itemAryToString(flattened);
            assert.include(flattenedStr, '[1,4 children_len:1]');
            assert.include(flattenedStr, '[4,5 children_len:2]');
            assert.include(flattenedStr, '[5,7 children_len:1]');
            assert.include(flattenedStr, '[7,10 children_len:1]');
        });
        it('real world example', function () {
            let overlappingList = new OverlappingList();
            overlappingList.add({start:40,end:66, value:1});
            overlappingList.add({start:67,end:93, value:2});
            overlappingList.add({start:28,end:54, value:-3});
            overlappingList.add({start:36,end:62, value:-4});
            let flattened = overlappingList.flatten();
            assert.equal(flattened.length, 6);
            let flattenedStr = OverlappingList.itemAryToString(flattened);
            assert.include(flattenedStr, '[28,36 children_len:1]');
            assert.include(flattenedStr, '[36,40 children_len:2]');
            assert.include(flattenedStr, '[40,54 children_len:3]');
            assert.include(flattenedStr, '[54,62 children_len:2]');
            assert.include(flattenedStr, '[62,66 children_len:1]');
        });
    });
});
