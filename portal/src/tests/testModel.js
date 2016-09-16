import {formatModelName, makeTitleForModelName} from './../app/models/Model.js';
var assert = require('chai').assert;

describe('Model', function () {
    describe('formatModelName()', function () {
        it('strips everything after _', function () {
            assert.equal('c-Myc', formatModelName('c-Myc_0001'));
            assert.equal('Mad1', formatModelName('Mad1_0002'));
            assert.equal('Gabpa', formatModelName('Gabpa_0006'));
        });
    });

    describe('makeTitleForModelName()', function () {
        it('should clean model and add title', function () {
            assert.equal('c-Myc predictions for details', makeTitleForModelName('c-Myc_0001', 'details'));
            assert.equal('Gabpa predictions for WASH7P', makeTitleForModelName('Gabpa_0006', 'WASH7P'));
        });
    });
});