import {formatModelName, makeTitleForModelName} from './../app/models/Model.js';
var assert = require('chai').assert;

describe('Model', function () {
    describe('formatModelName()', function () {
        it('strips everything after _', function () {
            assert.equal('c-Myc', formatModelName('c-Myc_0001'));
            assert.equal('Mad1', formatModelName('Mad1_0002'));
            assert.equal('Gabpa', formatModelName('Gabpa_0006'));
        });

        it('strips _ from _vs_ names', function () {
             assert.equal('Elk1 vs Ets1', formatModelName('Elk1_vs_Ets1'));
            assert.equal('Elk1 vs Ets1', formatModelName('Elk1_0004_vs_Ets1_0005'));
        });
    });

    describe('makeTitleForModelName()', function () {
        it('should clean model and add title', function () {
            assert.equal('c-Myc predictions for details', makeTitleForModelName('c-Myc_0001', 'details'));
            assert.equal('Gabpa predictions for WASH7P', makeTitleForModelName('Gabpa_0006', 'WASH7P'));
            assert.equal('E2f1 vs E2f4 preferences for WASH7P', makeTitleForModelName('E2f1_vs_E2f4', 'WASH7P'));
        });
    });
});