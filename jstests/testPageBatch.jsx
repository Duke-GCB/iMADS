// run: ./node_modules/.bin/babel-node jstests/testPageSettings.jsx
import PageBatch from './../src/app/store/PageBatch.jsx';

const assert = require('chai').assert;

//make sure we are splitting into the expected groups and page numbers
function testPageToItems() {
    var pagesInBatch = 3;
    var itemsPerPage = 4;
    var pageBatch = new PageBatch(pagesInBatch, itemsPerPage);

    pageBatch.setItems(1, []);
    assert.deepEqual(pageBatch.pageToItems, {1:[], 2:[], 3:[]});

    pageBatch.setItems(1, [1]);
    assert.deepEqual(pageBatch.pageToItems, {1: [1], 2:[], 3:[]});
    assert.equal(pageBatch.hasPage(1), true);
    assert.equal(pageBatch.hasPage(2), true);
    assert.equal(pageBatch.hasPage(3), true);
    assert.equal(pageBatch.isPageEmpty(1), false);
    assert.equal(pageBatch.isPageEmpty(2), true);
    assert.equal(pageBatch.isPageEmpty(3), true);

    pageBatch.setItems(1, [1, 2]);
    assert.deepEqual(pageBatch.pageToItems, {1: [1, 2], 2:[], 3:[]});

    pageBatch.setItems(1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.deepEqual(pageBatch.pageToItems, {1: [1, 2, 3, 4], 2: [5, 6, 7, 8], 3: [9, 10, 11]});

    pageBatch.setItems(1, [1, 2, 3, 4, 5]);
    assert.deepEqual(pageBatch.pageToItems, {1: [1, 2, 3, 4], 2: [5], 3:[]});

    pageBatch.setItems(2, [1]);
    assert.deepEqual(pageBatch.pageToItems, {4: [1], 5:[], 6:[]});

    pageBatch.setItems(3, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    assert.equal(pageBatch.hasPage(6), false);
    assert.equal(pageBatch.hasPage(7), true);
    assert.equal(pageBatch.hasPage(8), true);
    assert.equal(pageBatch.hasPage(9), true);
    assert.equal(pageBatch.hasPage(19), false);
    assert.deepEqual(pageBatch.pageToItems, {7: [1, 2, 3, 4], 8: [5, 6, 7, 8], 9: [9, 10, 11]});
    assert.deepEqual(pageBatch.getItems(7), [1, 2, 3, 4]);
    assert.deepEqual(pageBatch.getItems(8), [5, 6, 7, 8]);
    assert.deepEqual(pageBatch.getItems(9), [9, 10, 11]);

}

function testBatchPageNum() {
    var pagesInBatch = 3;
    var itemsPerPage = 4;
    var pageBatch = new PageBatch(pagesInBatch, itemsPerPage);
    assert.equal(pageBatch.getBatchPageNum(1), 1);
    assert.equal(pageBatch.getBatchPageNum(2), 1);
    assert.equal(pageBatch.getBatchPageNum(3), 1);
    assert.equal(pageBatch.getBatchPageNum(4), 2);
    assert.equal(pageBatch.getBatchPageNum(5), 2);
    assert.equal(pageBatch.getBatchPageNum(6), 2);
    assert.equal(pageBatch.getBatchPageNum(7), 3);
}

function testItemsPerBatch() {
    var pagesInBatch = 3;
    var itemsPerPage = 4;
    var pageBatch = new PageBatch(pagesInBatch, itemsPerPage);
    assert.equal(pageBatch.getItemsPerBatch(), 12);
    pagesInBatch = 2;
    itemsPerPage = 7;
    pageBatch = new PageBatch(pagesInBatch, itemsPerPage);
    assert.equal(pageBatch.getItemsPerBatch(), 14);

}

testPageToItems();

testBatchPageNum();

testItemsPerBatch();

