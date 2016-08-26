// Creates CSS color string 'rgb(int, int, int)' given a prediction value and some settings.
// This is done via: new ColorBlender(...).getColor()

// colors allowed for predictionColor color1 and color2
export const RED_COLOR_NAME = "red";
export const GREEN_COLOR_NAME = "green";
export const BLUE_COLOR_NAME = "blue";

// alternate colors to use when we have both color1 and color 2
export const YELLOW_COLOR_NAME = "yellow";
export const CYAN_COLOR_NAME = "cyan";
export const MAGENTA_COLOR_NAME = "magenta";

const ALT_COLOR_LOOKUP = [
    //color1         color2            alternate
    [RED_COLOR_NAME, GREEN_COLOR_NAME, YELLOW_COLOR_NAME],
    [RED_COLOR_NAME, BLUE_COLOR_NAME, MAGENTA_COLOR_NAME],
    [GREEN_COLOR_NAME, BLUE_COLOR_NAME, CYAN_COLOR_NAME],
];

let COLOR_RGB = {};
COLOR_RGB[RED_COLOR_NAME]       = [255,   0,   0];
COLOR_RGB[GREEN_COLOR_NAME]     = [0,   128,   0];
COLOR_RGB[BLUE_COLOR_NAME]      = [0,     0, 255];
COLOR_RGB[YELLOW_COLOR_NAME]    = [255, 255,   0];
COLOR_RGB[CYAN_COLOR_NAME]      = [0, 255,   255];
COLOR_RGB[MAGENTA_COLOR_NAME]   = [255, 0,   255];

export default class ColorBlender {
    constructor(value, predictionColor, useAlternateColor) {
        this.value = value;
        this.predictionColor = predictionColor;
        this.useAlternateColor = useAlternateColor;
    }

    isNegative() {
        return this.value < 0;
    }

    determineColorName() {
        if (this.useAlternateColor) {
            return ColorBlender.lookupAlternateColorName(this.predictionColor.color1, this.predictionColor.color2);
        } else {
            if (this.isNegative()) {
                return this.predictionColor.color2;
            } else {
                return this.predictionColor.color1;
            }
        }
    }

    getScaledValue() {
        if (this.isNegative()) {
            if (this.predictionColor.preferenceMin) {
                return this.value / Math.abs(this.predictionColor.preferenceMin);
            }
        } else {
            if (this.predictionColor.preferenceMax) {
                return this.value / Math.abs(this.predictionColor.preferenceMax);
            }
        }
        return this.value;
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

    static lookupAlternateColorName(color1Name, color2Name) {
        for (let colAry of ALT_COLOR_LOOKUP) {
            let c1 = colAry[0];
            let c2 = colAry[1];
            let alternate = colAry[2];
            if ((c1 === color1Name && c2 == color2Name) || (c1 === color2Name && c2 == color1Name)) {
                return alternate;
            }
        }
        return color1Name;
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