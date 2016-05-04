import HeatMapData from './../app/store/HeatMapData.js';
var assert = require('chai').assert;

describe('HeatMapData', function () {

    describe('getColor()', function () {
        it('should return white for 0.0 value', function () {
            var hmd = new HeatMapData('chr1', {value: 0.0});
            var result = hmd.getColor();
            assert.equal(result, 'rgb(255,255,255)');
        });
        it('should return red for 1.0 value', function () {
            var hmd = new HeatMapData('chr1', {value: 1.0});
            var result = hmd.getColor();
            assert.equal(result, 'rgb(255,0,0)');
        });
        it('should return pink for 0.5 value', function () {
            var hmd = new HeatMapData('chr1', {value: 0.5});
            var result = hmd.getColor();
            assert.equal(result, 'rgb(255,127,127)');
        });
    });

    describe('getX()', function () {
        it('should return 0 when offset is 10 and x start is 10', function () {
            var hmd = new HeatMapData('chr1', {start: 10}, 10);
            var result = hmd.getX(1);
            assert.equal(result, 0);
        });
        it('should return 10 when offset is 0 and x start is 10', function () {
            var hmd = new HeatMapData('chr1', {start: 10});
            var result = hmd.getX(1);
            assert.equal(result, 10);
        });
        it('should be 20 when start is 10 and scale is 2', function () {
            var hmd = new HeatMapData('chr1', {start: 10});
            var result = hmd.getX(2);
            assert.equal(result, 20);
        });
        it('should be 5 when start is 10 and scale is 0.5', function () {
            var hmd = new HeatMapData('chr1', {start: 10});
            var result = hmd.getX(0.5);
            assert.equal(result, 5);
        });
    });

    describe('getWidth()', function () {
        it('for scale 1 width should be PREDICTION_WIDTH', function () {
            var hmd = new HeatMapData('chr1', {});
            var result = hmd.getWidth(1);
            assert.equal(result, 20);
        });
        it('for scale 0.1 width should be PREDICTION_WIDTH/10', function () {
            var hmd = new HeatMapData('chr1', {});
            var result = hmd.getWidth(0.1);
            assert.equal(result, 2);
        });
        it('width should always be >= 1', function () {
            var hmd = new HeatMapData('chr1', {});
            var result = hmd.getWidth(0.001);
            assert.equal(result, 1);
        });
    });

    describe('getTitle()', function () {
        it('Default title should be empty', function () {
            var hmd = new HeatMapData('chr1', {start:1,end:2, value:3});
            var hmdX = hmd.getTitle();
            assert.equal(hmdX, '');
        });
        it('Default title should be a string when includeTitle is true', function () {
            var hmd = new HeatMapData('chr1', {start:1,end:2, value:3}, 0, true);
            var result = hmd.getTitle();
            assert.equal(result, 'chr1:1-2 -> 3');
        });
    });

    describe('buildCellArray()', function () {
        it('should should be sorted by value low to high', function () {
            var inputArray = [{start:1,end:2, value:1}, {start:4,end:5, value:0}];
            var inputArray = [{start:1,end:2, value:1}, {start:4,end:5, value:0}];
            var result = HeatMapData.buildCellArray('chr1', inputArray, {
                xOffset: 0,
                includeTitle: true,
                scale: 1,
                height: 10,
            });
            assert.equal(result.length, 2);
            assert.equal(result[0].color, 'rgb(255,255,255)');
            assert.equal(result[1].color, 'rgb(255,0,0)');
        });
        it('should fill in color, x, width, height and title', function () {
            var inputArray = [{start:1,end:2, value:1}, {start:4,end:5, value:0}];
            var result = HeatMapData.buildCellArray('chr1', inputArray, {
                xOffset: 0,
                includeTitle: true,
                scale: 1,
                height: 10,
            });
            assert.equal(result.length, 2);
            var item = result[0];
            assert.equal(item.color, 'rgb(255,255,255)');
            assert.equal(item.x, 4);
            assert.equal(item.width, 20);
            assert.equal(item.height, 10);
            assert.equal(item.title, 'chr1:1-2 -> 1\nchr1:4-5 -> 0');

            item = result[1];
            assert.equal(item.color, 'rgb(255,0,0)');
            assert.equal(item.x, 1);
            assert.equal(item.width, 20);
            assert.equal(item.height, 10);
            assert.equal(item.title, 'chr1:1-2 -> 1\nchr1:4-5 -> 0');
        });

        it('overlapping items should not titles if includeTitle is disabled', function () {
            var inputArray = [
                {start:1,end:5, value:1},
                {start:4,end:1, value:0},
            ];
            var result = HeatMapData.buildCellArray('chr1', inputArray, {
                xOffset: 0,
                includeTitle: false,
                scale: 1,
                height: 10,
            });
            assert.equal(result.length, 2);
            assert.equal(result[0].title, '');
            assert.equal(result[1].title, '');
        });


        it('overlapping items should share titles seperated by newline', function () {
            var inputArray = [
                {start:1,end:5, value:1},
                {start:4,end:7, value:0},
            ];
            var result = HeatMapData.buildCellArray('chr1', inputArray, {
                xOffset: 0,
                includeTitle: true,
                scale: 1,
                height: 10,
            });
            assert.equal(result.length, 2);
            assert.equal(result[0].title, 'chr1:1-5 -> 1\nchr1:4-7 -> 0');
            assert.equal(result[1].title, 'chr1:1-5 -> 1\nchr1:4-7 -> 0');
        });

        it('overlapping items should not combine everything', function () {
            var inputArray = [
                {end: 714177, start: 714157, value: 0.2967},
                {end: 713995, start: 713975, value: 0.3168},
                {end: 714022, start: 714002, value: 0.3133},
                {end: 713931, start: 713911, value: 0.215},
                {end: 714070, start: 714050, value: 0.3345},
                {end: 714020, start: 714000, value: 0.2865},
            ];
            var result = HeatMapData.buildCellArray('chr1', inputArray, {
                xOffset: 713931,
                includeTitle: true,
                scale: 1,
                height: 10,
            });
            // ordered by prediction low to high
            // items that overlap in the x direction share titles: so 714000 and n714002 share title.
            assert.equal(result.length, 6);
            assert.equal(result[0].title, 'chr1:713911-713931 -> 0.215');
            assert.equal(result[1].title, 'chr1:714000-714020 -> 0.2865\nchr1:714002-714022 -> 0.3133');
            assert.equal(result[2].title, 'chr1:714157-714177 -> 0.2967');
            assert.equal(result[3].title, 'chr1:714000-714020 -> 0.2865\nchr1:714002-714022 -> 0.3133');
            assert.equal(result[4].title, 'chr1:713975-713995 -> 0.3168');
            assert.equal(result[5].title, 'chr1:714050-714070 -> 0.3345');
        });

    });
});