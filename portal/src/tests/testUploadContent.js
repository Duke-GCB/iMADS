import UploadContent from './../app/models/UploadContent.js';
var assert = require('chai').assert;

let bigSize = 20 * 1024 * 1024 + 1;
let goodSize = 20 * 1024 * 1024;
let bigFile = {
    size: bigSize
};
let goodFile = {
    size: goodSize
};
let bigText = {
    length: bigSize
};
let goodText = {
    length: goodSize
};

describe('UploadContent', function () {
    describe('isTooBig()', function () {
        it('returns true for content > 20MB', function () {
            assert.equal(true, new UploadContent(bigFile, '').isTooBig());
            assert.equal(true, new UploadContent('', bigText).isTooBig());
        });
        it('returns false for content <= 20MB', function () {
            assert.equal(false, new UploadContent(goodFile, '').isTooBig());
            assert.equal(false, new UploadContent('', goodText).isTooBig());
        });
    });

    describe('fetchData()', function () {
        it('text good size will not throw exception', function () {
            let output = "";
            function consumeResult(result) {
                output = result;
            }
            new UploadContent('', "ABCEFG").fetchData(consumeResult)
            assert.equal("ABCEFG", output);
        });
        it('text too big will throw exception', function () {
            let output = "";
            function consumeResult(result) {
                output = result;
            }
            function throwBig() {
                 new UploadContent('', bigText).fetchData(consumeResult);
            }
            assert.throw(throwBig);
            assert.equal("", output);
        });
        it('file good size will not throw exception', function () {
            let output = "";
            function consumeResult(result) {
                output = result;
            }
            let uploadContent = new UploadContent(goodFile, '');
            //mock fetching file content
            uploadContent._fetchContent = function (consumeResult) {
                consumeResult("SampleFileData")
            };
            uploadContent.fetchData(consumeResult);
            assert.equal("SampleFileData", output);
        });
        it('file too big will throw exception', function () {
            let output = "";
            function consumeResult(result) {
                output = result;
            }
            function throwBig() {
                 new UploadContent(bigFile, '').fetchData(consumeResult);
            }
            assert.throw(throwBig);
            assert.equal("", output);
        });
    });

    describe('getTooBigErrorMessage()', function () {
        it('file too big will throw exception', function () {
            assert.equal("Content too big max 20MB", new UploadContent(goodFile, '').getTooBigErrorMessage());
        });
    });
});
