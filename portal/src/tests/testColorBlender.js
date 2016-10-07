import ColorBlender, {RED_COLOR_NAME, GREEN_COLOR_NAME, BLUE_COLOR_NAME,  YELLOW_COLOR_NAME,
    CYAN_COLOR_NAME, MAGENTA_COLOR_NAME} from './../app/models/ColorBlender.js';
var assert = require('chai').assert;

describe('ColorBlender', function () {
    describe('isNegative()', function () {
        it('true for values < 0', function () {
            assert.equal(true, new ColorBlender(-1).isNegative());
            assert.equal(true, new ColorBlender(-1.0).isNegative());
        });
        it('false for values >= 0', function () {
            assert.equal(false, new ColorBlender(0).isNegative());
            assert.equal(false, new ColorBlender(1).isNegative());
            assert.equal(false, new ColorBlender(1.0).isNegative());
        });
    });

    describe('determineColorName()', function () {
        it('returns color based on value', function () {
            let predictionColor = {
                color1: RED_COLOR_NAME,
                color2: BLUE_COLOR_NAME,
            };
            assert.equal(RED_COLOR_NAME, new ColorBlender(1, predictionColor).determineColorName());
            assert.equal(BLUE_COLOR_NAME, new ColorBlender(-1, predictionColor).determineColorName());
        });
    });

    describe('getScaledValue()', function () {
        it('just returns value when no preferenceMin or preferenceMax', function () {
            let predictionColor = {};
            assert.equal(10, new ColorBlender(10, predictionColor).getScaledValue());
            assert.equal(-10, new ColorBlender(-10, predictionColor).getScaledValue());
        });
        it('just scales value with abs preferenceMin/preferenceMax based on negative/positive values', function () {
            let predictionColor = {
                preferenceMax: 2,
                preferenceMin: -5,
            };
            assert.equal(5, new ColorBlender(10, predictionColor).getScaledValue());
            assert.equal(-2, new ColorBlender(-10, predictionColor).getScaledValue());
        });
    });

    describe('getColor()', function () {
        it('works for red and blue combination for prediction data', function () {
            let predictionColor = {
                color1: RED_COLOR_NAME,
                color2: BLUE_COLOR_NAME,
            };
            //test red values
            assert.equal('rgb(255,0,0)', new ColorBlender(1.0, predictionColor, false).getColor());
            assert.equal('rgb(255,128,128)', new ColorBlender(0.5, predictionColor, false).getColor());
            assert.equal('rgb(255,255,255)', new ColorBlender(0.0, predictionColor, false).getColor());
            //test blue values
            assert.equal('rgb(0,0,255)', new ColorBlender(-1.0, predictionColor, false).getColor());
            assert.equal('rgb(128,128,255)', new ColorBlender(-0.5, predictionColor, false).getColor());
        });

        it('works for red and blue combination for preference data', function () {
            let predictionColor = {
                color1: RED_COLOR_NAME,
                color2: BLUE_COLOR_NAME,
            };
            let deepRed = 'rgb(103,0,13)';
            assert.equal(deepRed, new ColorBlender(1.0, predictionColor, true).getColor());

            let zeroGray = 'rgb(190,190,190)';
            assert.equal(zeroGray, new ColorBlender(0.0, predictionColor, true).getColor());

            let midnightBlue = 'rgb(25,25,112)';
            assert.equal(midnightBlue, new ColorBlender(-1.0, predictionColor, true).getColor());
        });
    });

    describe('determineSlots()', function() {
        it('returns appropriate pairs for ten items', function () {
            let values = [
                { 'expected': [0,0], 'value': 0.0, 'numItems': 10},
                { 'expected': [0,1], 'value': 0.05, 'numItems': 10},
                { 'expected': [1,2], 'value': 0.1, 'numItems': 10},
                { 'expected': [2,3], 'value': 0.2, 'numItems': 10},
                { 'expected': [3,4], 'value': 0.3, 'numItems': 10},
                { 'expected': [5,6], 'value': 0.5, 'numItems': 10},
                { 'expected': [8,9], 'value': 0.9, 'numItems': 10},
                { 'expected': [9,9], 'value': 1.0, 'numItems': 10},
                { 'expected': [9,9], 'value': 2.0, 'numItems': 10}
            ];
            for (let data of values) {
                assert.deepEqual(data.expected, ColorBlender.determineSlots(data.value, data.numItems));
            }
        });
        it('returns appropriate pairs for six items', function () {
            assert.deepEqual([5, 5], ColorBlender.determineSlots(-0.972, 6));
        });
    });

    describe('determineSlotValue()', function () {
        it('returns expected values', function () {
            let values = [
                { 'expected': '0.0', 'slotNum': 0, 'numItems': 10},
                { 'expected': '0.1', 'slotNum': 1, 'numItems': 10},
                { 'expected': '0.2', 'slotNum': 2, 'numItems': 10},
                { 'expected': '0.3', 'slotNum': 3, 'numItems': 10},
                { 'expected': '0.4', 'slotNum': 4, 'numItems': 10},
                { 'expected': '0.9', 'slotNum': 9, 'numItems': 10},

            ];
            for (let data of values) {
                let result = ColorBlender.determineSlotValue(data.slotNum, data.numItems);
                assert.deepEqual(data.expected, result.toFixed(1));
            }
        });
    });

    describe('interpolate()', function () {
        it('work with 255 0 range', function () {
            let values = [
                { 'expected': 255, 'input': 0.0 },
                { 'expected': 128, 'input': 0.5 },
                { 'expected': 0,   'input': 1.0 },
            ];
            for (let data of values) {
                assert.equal(data.expected, ColorBlender.interpolate(255, 0, data.input));
            }
        });
        it('work with 0 255 range', function () {
            let values = [
                { 'expected': 0, 'input': 0.0 },
                { 'expected': 128, 'input': 0.5 },
                { 'expected': 255,   'input': 1.0 },
            ];
            for (let data of values) {
                assert.equal(data.expected, ColorBlender.interpolate(0, 255, data.input));
            }
        });
        it('work with 128 0 range', function () {
            let values = [
                { 'expected': 128, 'input': 0.0 },
                { 'expected': 64, 'input': 0.5 },
                { 'expected': 0,   'input': 1.0 },
            ];
            for (let data of values) {
                assert.equal(data.expected, ColorBlender.interpolate(128, 0, data.input));
            }
        });
    });

    describe('interpolateRGB()', function () {
        let zeroColorAry = [255, 255, 255];
        it('red with 0 value is white', function () {
            let white = { r: 255, g: 255, b: 255 };
            assert.deepEqual(white, ColorBlender.interpolateRGB(zeroColorAry, [255, 0, 0], 0.0));
        });
        it('red with 1 value is red', function () {
            let red = { r: 255, g: 0, b: 0 };
            assert.deepEqual(red, ColorBlender.interpolateRGB(zeroColorAry, [255, 0, 0], 1.0));
        });
        it('red with 0.5 value is pink', function () {
            let pink = { r: 255, g: 128, b: 128 };
            assert.deepEqual(pink, ColorBlender.interpolateRGB(zeroColorAry, [255, 0, 0], 0.5));
        });

        it('blue with 0 value is white', function () {
            let white = { r: 255, g: 255, b: 255 };
            assert.deepEqual(white, ColorBlender.interpolateRGB(zeroColorAry, [0, 0, 255], 0.0));
        });
        it('blue with 1 value is blue', function () {
            let blue = { r: 0, g: 0, b: 255 };
            assert.deepEqual(blue, ColorBlender.interpolateRGB(zeroColorAry, [0, 0, 255], 1.0));
        });
        it('blue with 0.5 value is light blue', function () {
            let lightBlue = { r: 128, g: 128, b: 255 };
            assert.deepEqual(lightBlue, ColorBlender.interpolateRGB(zeroColorAry, [0, 0, 255], 0.5));
        });
    });
});