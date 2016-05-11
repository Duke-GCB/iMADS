// Transform prediction data into heat map data.

const PREDICTION_WIDTH = 20;

function sortByValue(a, b) {
    return a.value - b.value;
}

function sortByX(a, b) {
    return a.x - b.x;
}

class HeatMapData {
    constructor(chrom, data, xOffset = 0, includeTitle = false) {
        this.chrom = chrom;
        this.data = data;
        this.xOffset = xOffset;
        this.includeTitle = includeTitle;
    }

    static buildCellArray(chrom, inputArray, props) {
        let results = [];
        let sortedArray = inputArray.slice();
        sortedArray.sort(sortByValue);
        for (let data of sortedArray) {
            let hmd = new HeatMapData(chrom, data, props.xOffset, props.includeTitle);
            results.push({
                color: hmd.getColor(),
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

    getColor() {
        let value = this.data.value;
        let revColor = 1 - value;
        let red = 255;
        let green = parseInt(255 * revColor);
        let blue = parseInt(255 * revColor);
        let fill = "rgb(" + red + "," + green + "," + blue + ")";
        return fill;
    }

    getX(scale, strand, xOffsetEnd) {
        let start = this.data.start;
        let value = this.data.value;
        if (strand === '-') {
            let x = start - this.xOffset;
            x = (xOffsetEnd - this.xOffset) - x - PREDICTION_WIDTH;
            return x * scale;
        } else {
            return parseInt((start - this.xOffset) * scale);    
        }
    }

    getWidth(scale) {
        return Math.max(1, parseInt(PREDICTION_WIDTH * scale));
    }

    getTitle() {
        if (this.includeTitle) {
            return this.chrom + ":" + this.data.start + '-' + this.data.end + " -> " + this.data.value;
        }
        return '';
    }
}
export default HeatMapData;
