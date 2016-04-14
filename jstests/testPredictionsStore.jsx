import PredictionsStore from './../src/app/store/PredictionsStore.jsx';
import PageBatch from './../src/app/store/PageBatch.jsx';
import URLBuilder from './../src/app/store/URLBuilder.jsx';

const assert = require('chai').assert;

var enable_ajax = false;
var good_ajax_response = true;
var good_ajax_data = [];
var bad_ajax_url = '/stuff';
var bad_ajax_status = 500;
var bad_ajax_message = 'Some Error';
var searchSettings = {
        genome: 'hg18',
        gene_list: 'knowngenes',
        upstream: 100,
        downstream: 200,
        all: true,
        max_prediction_sort: false,
    };

function fake_ajax(fetchData) {
    if (!enable_ajax) {
        assert.fail('Ajax should not have been called.');
    }
    if (good_ajax_response) {
        fetchData.success(good_ajax_data);
    } else {
        fetchData.error(bad_ajax_url, bad_ajax_status, bad_ajax_message);
    }
}

//make sure we are splitting into the expected groups and page numbers
function testAlreadyInPageBatch() {
    var pagesInBatch = 3;
    var itemsPerPage = 4;
    var pageBatch = new PageBatch(pagesInBatch, itemsPerPage);
    var builder = new URLBuilder(fake_ajax);
    pageBatch.setItems(1, [1,2,3,4,5]);
    var ps = new PredictionsStore(pageBatch, builder, searchSettings);
    request_page(ps, 1, [1,2,3,4], '', true, false);
    request_page(ps, 2, [5], '', true, false);
    request_page(ps, 3, [], '', true, false);
}

function testNeedsToFetchFirst() {
    var pagesInBatch = 3;
    var itemsPerPage = 4;
    var pageBatch = new PageBatch(pagesInBatch, itemsPerPage);
    var builder = new URLBuilder(fake_ajax);
    var ps = new PredictionsStore(pageBatch, builder, searchSettings);
    good_ajax_data = [1,2,3,4,5]
    request_page(ps, 1, [1,2,3,4], '', true, true);
    request_page(ps, 2, [5], '', true, false);
}

function testNeedsToFetchSecond() {
    var pagesInBatch = 3;
    var itemsPerPage = 4;
    var pageBatch = new PageBatch(pagesInBatch, itemsPerPage);
    var builder = new URLBuilder(fake_ajax);
    var ps = new PredictionsStore(pageBatch, builder, searchSettings);
    good_ajax_data = [1,2,3,4,5]
    request_page(ps, 2, [5], '', true, true);
    request_page(ps, 1, [1,2,3,4], '', true, false);
}

function request_page(ps, page, good_value, bad_message, good_expected, enable_ajax_value) {
    enable_ajax = enable_ajax_value;
    var goodCalled = false;
    var badCalled = false;
    ps.requestPage(page, searchSettings, function (data) {
        assert.deepEqual(good_value, data);
        goodCalled = true;
    }, function (message) {
        assert.equals(message, bad_message);
        badCalled = true;
    });
    assert.equal(goodCalled, good_expected, 'Should have called good');
    assert.equal(badCalled, !good_expected, 'Should NOT have called bad');
}

testAlreadyInPageBatch();
testNeedsToFetchFirst();
testNeedsToFetchSecond();