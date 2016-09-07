import PredictionDetail from './../app/models/PredictionDetail.js';
var assert = require('chai').assert;

describe('PredictionDetail', function () {
    describe('getDetails()', function () {
        it('should return sorted values with more properties', function () {
            let rowData = {
                values: [{
                    start: 10,
                    end: 20,
                    value: 2.5
                },{
                    start: 1,
                    end: 10,
                    value: 12.5
                }]
            }
            let predDetail = new PredictionDetail();
            let detailAry = predDetail.getDetails(rowData, 'chr1', [0]);
            assert.equal(2, detailAry.length);

            // FIRST ROW
            // input start is bed value and display is +1
            assert.equal(2, detailAry[0].start);
            // end, value is same as input
            assert.equal(10, detailAry[0].end);
            assert.equal(12.5, detailAry[0].value);
            //more properties
            assert.equal('active', detailAry[0].rowClassName);
            assert.equal('chr1:2-10', detailAry[0].position);
            assert.equal('chr1', detailAry[0].chrom);

            // SECOND ROW
            // input start is bed value and display is +1
            assert.equal(11, detailAry[1].start);
            // end, value is same as input
            assert.equal(20, detailAry[1].end);
            assert.equal(2.5, detailAry[1].value);
            //more properties
            assert.equal('', detailAry[1].rowClassName);
            assert.equal('chr1:11-20', detailAry[1].position);
            assert.equal('chr1', detailAry[1].chrom);
        });
    });

    describe('getSeqFromRanges()', function () {
        it('should lookup value based on position', function () {
            let ranges = {'chr1:1-10':'ACBGT'};
            let detailObject = {
                position: 'chr1:1-10',
            }
            let predDetail = new PredictionDetail();
            let seq = predDetail.getSeqFromRanges(detailObject, ranges);
            assert.equal('ACBGT', seq);
        });
    });

    describe('getSeqFromParentSequence()', function () {
        it('should substring based on start,end', function () {
            let parentSequence = "ACGTACGTACGT"
            let detailObject = {
                start: 1,
                end: 5
            }
            let predDetail = new PredictionDetail();
            let seq = predDetail.getSeqFromParentSequence(detailObject, parentSequence);
            assert.equal('ACGTA', seq);
        });
    });
});