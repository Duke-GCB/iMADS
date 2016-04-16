import StreamValue from './../app/store/StreamValue.js';
var assert = require('chai').assert;

describe('StreamValue', function () {
    var streamValue = new StreamValue(100);
    var goodValues = [
        '0', '1', '100', '99', '45', '62'
    ];
    var badValues = [
        '', '101', '1000', 'x100', '100x'
    ];
    describe('isValid()', function () {
        it('should return true for good values', function () {
            for (var i = 0; i <  goodValues.length; i++) {
                assert.equal(true, streamValue.isValid(goodValues[i]), "Should be valid " + goodValues[i]);
            }
        });
        it('should return false for bad values', function () {
            for (var i = 0; i <  badValues.length; i++) {
                assert.equal(false, streamValue.isValid(badValues[i]), "Should be invalid " + badValues[i]);
            }
        });

    });
});
