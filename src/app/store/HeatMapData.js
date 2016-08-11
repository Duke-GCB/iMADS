// Transform prediction data into heat map data.

function sortByValue(a, b) {
    return a.value - b.value;
}

function sortByX(a, b) {
    return a.x - b.x;
}

class HeatMapData {
    constructor(chrom, data, xOffset = 0, includeTitle = false, itemWidth = PREDICTION_WIDTH) {
        this.chrom = chrom;
        this.data = data;
        this.xOffset = xOffset;
        this.includeTitle = includeTitle;
        this.itemWidth = itemWidth;
    }

    static buildCellArray(chrom, inputArray, props, predictionColor) {
        let results = [];
        let sortedArray = inputArray.slice();
        sortedArray.sort(sortByValue);
        for (let data of sortedArray) {
            let itemWidth = data.end - data.start;
            let hmd = new HeatMapData(chrom, data, props.xOffset, props.includeTitle, itemWidth);
            results.push({
                color: hmd.getColor(predictionColor),
                x: hmd.getX(props.scale, props.strand, props.xOffsetEnd),
                width: hmd.getWidth(props.scale),
                height: props.height,
                title: hmd.getTitle(),
                start: data.start,
                end: data.end,
            });
        }
        if (props.includeTitle) {
            HeatMapData.combineOverlappingTitles(results);
        }
        return results;
    }

    static combineOverlappingTitles(cells) {
        let prev = undefined;
        let group = [];
        let sortedArray = cells.slice();
        sortedArray.sort(sortByX);
        for (let cell of sortedArray) {
            if (prev) {
                let prevEnd = prev.x + prev.width;
                if (prevEnd > cell.x) {
                    if (group.length === 0) {
                        group.push(prev);
                    }
                    group.push(cell);
                } else {
                    if (group.length > 0) {
                        HeatMapData.mergeTitles(group);
                        group = [];
                    }
                }
            }
            prev = cell;
        }
        if (group.length > 0) {
            HeatMapData.mergeTitles(group);
            group = [];
        }
    }

    static mergeTitles(cells) {
        let combinedTitle = '';
        let prefix = '';
        for (let cell of cells) {
            combinedTitle += prefix;
            combinedTitle += cell.title;
            prefix = "\n";
        }
        for (let cell of cells) {
            cell.title = combinedTitle;
        }
    }

    getColor(predictionColor) {
        let value = this.data.value;
        let primary = 255;
        let revColor = 1 - value;
        let secondary = parseInt(255 * revColor);
        let red = primary;
        let green = secondary;
        let blue = secondary;
        if (predictionColor.color1 == "blue") {
            red = secondary;
            green = secondary;
            blue = primary;
        }
        if (predictionColor.color1 == "green") {
            // Dark green is 0, 128, 0 instead of 0, 255, 0 (if it was similar red or blue)
            let minGreen = Math.min(secondary + 30, 255);
            let greenValue = Math.max(128, minGreen);
            red = secondary;
            green = greenValue;
            blue = secondary;
        }
        return "rgb(" + red + "," + green + "," + blue + ")";
    }

    getX(scale, strand, xOffsetEnd) {
        let start = this.data.start;
        let value = this.data.value;
        if (strand === '-') {
            let x = start - this.xOffset;
            x = (xOffsetEnd - this.xOffset) - x - this.itemWidth;
            return x * scale;
        } else {
            return parseInt((start - this.xOffset) * scale);    
        }
    }

    getWidth(scale) {
        return Math.max(1, parseInt(this.itemWidth * scale));
    }

    getTitle() {
        if (this.includeTitle) {
            if (this.chrom) {
                return this.chrom + ":" + this.data.start + '-' + this.data.end + " -> " + this.data.value;
            } else {
                return this.data.start + '-' + this.data.end + " -> " + this.data.value;
            }
        }
        return '';
    }
}
export default HeatMapData;
