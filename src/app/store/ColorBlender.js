// Creates CSS color string 'rgb(int, int, int)' given a prediction value and some settings.
// This is done via: new ColorBlender(...).getColor()

// colors allowed for predictionColor color1 and color2
export const RED_COLOR_NAME = "red";
export const GREEN_COLOR_NAME = "green";
export const BLUE_COLOR_NAME = "blue";

let COLOR_RGB = {};
COLOR_RGB[RED_COLOR_NAME]       = [255,   0,   0];
COLOR_RGB[GREEN_COLOR_NAME]     = [0,   128,   0];
COLOR_RGB[BLUE_COLOR_NAME]      = [0,     0, 255];

export default class ColorBlender {
    constructor(value, predictionColor) {
        this.value = value;
        this.predictionColor = predictionColor;
    }

    isNegative() {
        return this.value < 0;
    }

    determineColorName() {
        if (this.isNegative()) {
            return this.predictionColor.color2;
        } else {
            return this.predictionColor.color1;
        }
    }

    getScaledValue() {
        if (this.isNegative()) {
            return ColorBlender.scaleValue(this.value, this.predictionColor.preferenceMin);
        } else {
            return ColorBlender.scaleValue(this.value, this.predictionColor.preferenceMax);
        }
    }

    static scaleValue(value, limitValue) {
        if (limitValue) {
            return value / Math.abs(limitValue);
        }
        return value;
    }

    getColor() {
        let colorName = this.determineColorName();
        let colorRGB = COLOR_RGB[colorName];
        let colorValues = ColorBlender.interpolateRGB(colorRGB[0], colorRGB[1], colorRGB[2], this.getScaledValue());
        return this.getRGBString(colorValues);
    }

    getRGBString(rgbValues) {
        let {r, g, b} = rgbValues;
        return "rgb(" + r + "," + g + "," + b + ")";
    }

    // zeroColor it is always higher than oneColorInt
    static interpolate(zeroColorInt, oneColorInt, value) {
        let diff = zeroColorInt - oneColorInt;
        return zeroColorInt - parseInt(Math.abs(value) * diff);
    }

    static interpolateRGB(r, g, b, value) {
        let zeroColorInt = 255;
        return {
            r: ColorBlender.interpolate(zeroColorInt, r, value),
            g: ColorBlender.interpolate(zeroColorInt, g, value),
            b: ColorBlender.interpolate(zeroColorInt, b, value),
        }
    }
}