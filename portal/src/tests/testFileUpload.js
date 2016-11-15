import FileUpload from './../app/models/FileUpload.js';
var assert = require('chai').assert;

describe('FileUpload', function () {
    describe('isTooBigToUpload()', function () {
        it('returns true for > 20MB', function () {
            assert.equal(true, FileUpload.isTooBigToUpload(20 * 1024 * 1024 + 1)); // 20 MB + 1
            assert.equal(true, FileUpload.isTooBigToUpload(21 * 1024 * 1024));     // 21 MB
        });
        it('returns false for <= 20MB', function () {
            assert.equal(false, FileUpload.isTooBigToUpload(19 * 1024 * 1024));    // 19 MB
            assert.equal(false, FileUpload.isTooBigToUpload(20 * 1024 * 1024));    // 20 MB
            assert.equal(false, FileUpload.isTooBigToUpload(20 * 1024 * 1024 - 1));// 20 MB - 1
        });
    });
    describe('constructor()', function () {
        it('throws for > 20MB', function () {
            function throwBig() {
                new FileUpload({size: 20 * 1024 * 1024 + 1}); // 20MB + 1
            }
            assert.throw(throwBig);
        });
        it('will not throw for > 20MB', function () {
            let bigFile = {
                size: 20 * 1024 * 1024
            };
            function willNotThrowBig() {
                new FileUpload({size: 20 * 1024 * 1024}); // 20MB + 1
            }
            assert.doesNotThrow(willNotThrowBig);
        });
    });
    describe('isTooBigFileOrText()', function () {
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
        it('true for > 20MB file size', function () {
            assert.equal(true, FileUpload.isTooBigFileOrText(bigFile, undefined));
        });
        it('false for <= 20MB file size', function () {
            assert.equal(false, FileUpload.isTooBigFileOrText(goodFile, undefined));
        });
        it('true for > 20MB textValue length', function () {
            assert.equal(true, FileUpload.isTooBigFileOrText(undefined, bigText));
        });
        it('false for <= 20MB textValue length', function () {
            assert.equal(false, FileUpload.isTooBigFileOrText(goodFile, goodText));
        });
        
    });

});
