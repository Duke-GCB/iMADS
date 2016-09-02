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
        it('works for red and blue combination', function () {
            let predictionColor = {
                color1: RED_COLOR_NAME,
                color2: BLUE_COLOR_NAME,
            };
            //test red values
            assert.equal('rgb(255,0,0)', new ColorBlender(1.0, predictionColor).getColor());
            assert.equal('rgb(255,128,128)', new ColorBlender(0.5, predictionColor).getColor());
            assert.equal('rgb(255,255,255)', new ColorBlender(0.0, predictionColor).getColor());
            //test blue values
            assert.equal('rgb(0,0,255)', new ColorBlender(-1.0, predictionColor).getColor());
            assert.equal('rgb(128,128,255)', new ColorBlender(-0.5, predictionColor).getColor());

        });
    });

    describe('interpolate()', function () {
        it('work with 255 0 range', function () {
            assert.equal(255, ColorBlender.interpolate(255, 0, 0.0));
            assert.equal(128, ColorBlender.interpolate(255, 0, 0.5));
            assert.equal(0, ColorBlender.interpolate(255, 0, 1.0));
        });
    });

    describe('interpolateRGB()', function () {
        it('red with 0 value is white', function () {
            let white = { r: 255, g: 255, b: 255 };
            assert.deepEqual(white, ColorBlender.interpolateRGB(255, 0, 0, 0.0));
        });
        it('red with 1 value is red', function () {
            let red = { r: 255, g: 0, b: 0 };
            assert.deepEqual(red, ColorBlender.interpolateRGB(255, 0, 0, 1.0));
        });
        it('red with 0.5 value is pink', function () {
            let pink = { r: 255, g: 128, b: 128 };
            assert.deepEqual(pink, ColorBlender.interpolateRGB(255, 0, 0, 0.5));
        });

        it('blue with 0 value is white', function () {
            let white = { r: 255, g: 255, b: 255 };
            assert.deepEqual(white, ColorBlender.interpolateRGB(0, 0, 255, 0.0));
        });
        it('blue with 1 value is blue', function () {
            let blue = { r: 0, g: 0, b: 255 };
            assert.deepEqual(blue, ColorBlender.interpolateRGB(0, 0, 255, 1.0));
        });
        it('blue with 0.5 value is light blue', function () {
            let lightBlue = { r: 128, g: 128, b: 255 };
            assert.deepEqual(lightBlue, ColorBlender.interpolateRGB(0, 0, 255, 0.5));
        });
    });
});