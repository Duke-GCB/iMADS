// Creates CSS color string 'rgb(int, int, int)' given a prediction value and some settings.
// This is done via: new ColorBlender(...).getColor()

const POS_FLOAT_CUTOOFF = 0.001;
const NEG_FLOAT_CUTOOFF = -0.001;

// colors allowed for predictionColor color1 and color2
export const RED_COLOR_NAME = "red";
export const GREEN_COLOR_NAME = "green";
export const BLUE_COLOR_NAME = "blue";

let COLOR_RGB = {};
COLOR_RGB[RED_COLOR_NAME]       = [255,   0,   0];
COLOR_RGB[GREEN_COLOR_NAME]     = [0,   128,   0];
COLOR_RGB[BLUE_COLOR_NAME]      = [0,     0, 255];

// PREFERENCE_COLORS based on https://github.com/Duke-GCB/TrackHubGenerator/blob/master/cwl/bin/add_itemrgb_column.py
export let PREFERENCE_GRAY = [190, 190, 190];
// The preferred length of a preference array.
export let PREFERRED_PREFERENCE_ARRAY_LENGTH = 9;
/**
 * Color constants for Red gradient
 * From Colorbrewer Red 9 http://colorbrewer2.org/?type=sequential&scheme=Reds&n=9
 */
export let PREFERENCE_REDS = [
    [255, 245, 240],
    [254, 224, 210],
    [252, 187, 161],
    [252, 146, 114],
    [251, 106, 74],
    [239, 59, 44],
    [203, 24, 29],
    [165, 15, 21],
    [103, 0, 13]
];

/*
 * Color constants for blue gradient
 * http://colorbrewer2.org/?type=sequential&scheme=Blues&n=9#type=sequential&scheme=Blues&n=9
 */
export let PREFERENCE_BLUES = [
    [99, 184, 255],   // steelblue1
    [92, 172, 238],   // steelblue2
    [79, 148, 205],   // steelblue3
    [70, 130, 180],   // steelblue
    [54, 100, 139],   // steelblue4
    [25, 25, 112]    // midnightblue
];

/**
 * Color constants for green gradient
 * http://colorbrewer2.org/?type=sequential&scheme=Reds&n=9#type=sequential&scheme=Greens&n=9
 */
export let PREFERENCE_GREENS = [
    [247,252,245],
    [229,245,224],
    [199,233,192],
    [161,217,155],
    [116,196,118],
    [65,171,93],
    [35,139,69],
    [0,109,44],
    [0,68,27]
];

let PREF_ARRAY_LOOKUP = {};
PREF_ARRAY_LOOKUP[RED_COLOR_NAME] = PREFERENCE_REDS;
PREF_ARRAY_LOOKUP[GREEN_COLOR_NAME] = PREFERENCE_GREENS;
PREF_ARRAY_LOOKUP[BLUE_COLOR_NAME] = PREFERENCE_BLUES;

export default class ColorBlender {
    constructor(value, predictionColor, isPreference) {
        this.value = value;
        this.predictionColor = predictionColor;
        this.isPreference = isPreference;
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

    /**
     * Using this.value and the preferenceBin array determine which color slot we should show.
     * @returns {number} integer 0 -> bins.length
     */
    getPreferenceSlot() {
        let bins = this.getPreferenceBin();
        let slot = 0; // if greater than all bins must be the last slot
        let absValue = Math.abs(this.value);
        for (let i = 0; i < bins.length; i++) {
            let binValue = Math.abs(bins[i]);
            if (binValue > absValue) {
                break;
            }
            slot = i + 1;
        }
        return slot;
    }

    /**
     * Return array of inner fenceposts used to determine which slot in color arrays we should use.
     * If you have three colors ...-1, 1-10, 10-... it returns an array like so: [1, 10]
     * Anything below the lowest number is assumed to be the first bin anything greater than the
     * last fencepost is assumed to be the last bin.
     * @returns array of inner fencepost cutoff values
     */
    getPreferenceBin() {
        if (this.isNegative()) {
            return this.predictionColor.preferenceBins.neg;
        } else {
            return this.predictionColor.preferenceBins.pos;
        }
    }

    /**
     * Return array of r,g,b values for this.value.
     * @param colorName determines which color array to use eg: 'red'
     * @returns array of r g b
     */
    getPreferenceColorArray(colorName) {
        let slot = this.getPreferenceSlot();
        let colorArray = PREF_ARRAY_LOOKUP[colorName];
        if (colorArray.length != PREFERRED_PREFERENCE_ARRAY_LENGTH) {
            slot = this.scalePreferenceSlot(slot, colorArray.length);
        }
        return colorArray[slot];
    }

    /**
     * Return array of r,g,b values for this.value.
     * @param colorName determines which color array to use eg: 'red'
     * @returns array of r g b
     */
    scalePreferenceSlot(slot, arrayLength) {
        let scaleFactor = parseFloat(arrayLength) / parseFloat(PREFERRED_PREFERENCE_ARRAY_LENGTH);
        let scaledSlot = slot * scaleFactor;
        return Math.round(scaledSlot);
    }

    /**
     * Return CSS color string appropriate for this.value and color settings.
     */
    getColor() {
        let colorName = this.determineColorName();
        if (this.isPreference) {
            return this.getPreferenceColor(colorName);
        }
        let colorRGB = COLOR_RGB[colorName];
        let zeroColor = [255, 255, 255];
        let colorValues = ColorBlender.interpolateRGB(zeroColor, colorRGB, this.value);
        return this.getRGBString(colorValues);
    }

    /**
     * Returns an array of color values based on colorPreference.color1/2 and this.value being postitive or neg.
     * @returns array of colors(array)
     */
    getPreferenceArray() {
        let colorName = this.determineColorName();
        return PREF_ARRAY_LOOKUP[colorName];
    }

    /**
     * Returns CSS color "rgb(r,g,b)" for this.value.
     * Looks up which array to use based on colorName.
     * Determines which slot in the array to use based on preferenceBins.
     * @param colorName name of the color array to use eg: 'red'
     * @returns CSS color string
     */
    getPreferenceColor(colorName) {
        let value = this.value;
        let colorRGB = PREFERENCE_GRAY;
        if (value > POS_FLOAT_CUTOOFF || value < NEG_FLOAT_CUTOOFF) {
            colorRGB = this.getPreferenceColorArray(colorName);
        }
        return this.getRGBString({
            'r': colorRGB[0],
            'g': colorRGB[1],
            'b': colorRGB[2]
        });
    }

    /**
     * Give a value range 0.0 to 1.0 pick a pair of indexes into an array of size numItems
     * to allow blending the values at these two indexes.
     * @param value value we will
     * @param numItems int: number of items in an array
     * @returns [int, int] indexes into an array of numItems length
     */
    static determineSlots(value, numItems) {
        value = Math.abs(value);
        let lastSlot = numItems - 1;
        if (value >= 1.0) {
            return [lastSlot, lastSlot];
        }
        if (value <= 0.0) {
            return [0, 0];
        }
        let numPairs = numItems - 1;
        let slot = Math.round(value * numPairs);
        let secondSlot = slot + 1;
        if (secondSlot >= numItems) {
            secondSlot = slot;
        }
        return [slot, secondSlot]
    }

    /**
     * Given a slotNum(array index) and number of items in array determine
     * a value between 0.0 -> 1.0 representing that stot
     * @param slotNum int index into the array
     * @param numItems int number items in the array
     */
    static determineSlotValue(slotNum, numItems) {
        return slotNum * (1.0 / numItems);
    }

    /**
     * Given an index, the number of items in an array and a value 0.0 -> 1.0
     * scale the value based on the position in the array.
     * @param slotNum int index into the array
     * @param numItems  int number items in the array
     * @param value value to scale
     * @returns {number} scaled value based on the slot specified
     */
    static scaleValueForSlot(slotNum, numItems, value) {
        value = Math.abs(value);
        let slotValue = ColorBlender.determineSlotValue(slotNum, numItems);
        return Math.abs(value - slotValue) * numItems;
    }

    getRGBString(rgbValues) {
        let {r, g, b} = rgbValues;
        return "rgb(" + r + "," + g + "," + b + ")";
    }

    /**
     * Interpolates between zeroColor and oneColor based on value.
     * @param zeroColor int color for when value == 0
     * @param oneColor int color for when value == 1
     * @param value value between 0.0 and 1.0 to scale between zeroColor and oneColor
     * @returns {int} between zeroColor and oneColor
     */
    static interpolate(zeroColor, oneColor, value) {
        if (value < 0) {
            value *= -1;
        }
        let zeroColorInt = parseInt(zeroColor);
        let oneColorInt = parseInt(oneColor);
        let diff = oneColorInt - zeroColorInt;
        return Math.round(zeroColorInt  +  (value * diff));
    }

    static interpolateRGB(lowColorArray, highColorArray, value) {
        return {
            r: ColorBlender.interpolate(lowColorArray[0], highColorArray[0], value),
            g: ColorBlender.interpolate(lowColorArray[1], highColorArray[1], value),
            b: ColorBlender.interpolate(lowColorArray[2], highColorArray[2], value)
        }
    }
}