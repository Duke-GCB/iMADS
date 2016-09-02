// Transform prediction data into heat map data.
import ColorBlender from './ColorBlender.js';

function compareNumbers(a, b) {
  return a - b;
}

function sortByStart(a, b) {
  return a.start - b.start;
}

function sortByAbsValue(a, b) {
  return Math.abs(a.start) - Math.abs(b.start);
}

class HeatMapData {
    constructor(chrom, data, xOffset = 0, includeTitle = false, itemWidth) {
        this.chrom = chrom;
        this.data = data;
        this.xOffset = xOffset;
        this.includeTitle = includeTitle;
        this.itemWidth = itemWidth;
    }

    static makeTitle(chrom, item, props) {
        let result = '';
        let prefix = '';
        if (props.includeTitle) {
            for (let child of item.children) {
                result += prefix;
                let start = child.start + 1;
                if (chrom) {
                    result += chrom + ":" + start + '-' + child.end + " -> " + child.value;
                } else {
                    result += start + '-' + child.end + " -> " + child.value;
                }
                prefix = "\n";
            }
        }
        return result;
    }

    static buildCellArray(chrom, inputArray, props, predictionColor) {
        let results = [];
        let idx = 0;
        let sortedInputArray = inputArray.slice();
        sortedInputArray.sort(sortByAbsValue);
        for (let item of sortedInputArray) {
            item.idx = idx;
            idx += 1;
        }
        let itemArray = new OverlappingList(inputArray).flatten();
        itemArray.sort(sortByAbsValue);
        for (let item of itemArray) {
            let itemWidth = item.end - item.start + 1;
            let data = {
                start: item.start,
                end: item.end,
                value: item.value,
            };
            let hmd = new HeatMapData(chrom, data, props.xOffset, props.includeTitle, itemWidth);
            let color = new ColorBlender(data.value, predictionColor).getColor();
            results.push({
                color: color,
                x: hmd.getX(props.scale, props.strand, props.xOffsetEnd),
                width: hmd.getWidth(props.scale),
                height: props.height,
                title: HeatMapData.makeTitle(chrom, item, props),
                start: data.start,
                end: data.end,
                idxList: HeatMapData.getIdxArrayFromChildren(item.children),
            });
        }
        return results;
    }

    static maxValueFromChildren(children) {
        let max = children[0].value;
        let min = children[0].value;
        for (let child of children) {
            max = Math.max(child.value, max);
            min = Math.min(child.value, min);
        }
        if (Math.abs(min) > max) {
            return min;
        }
        return max;
    }

    static getIdxArrayFromChildren(children) {
        let result = [];
        for (let child of children) {
            result.push(child.idx);
        }
        return result;
    }

    getX(scale, strand, xOffsetEnd) {
        let start = this.data.start;
        let value = this.data.value;
        let scaledX;
        if (strand === '-') {
            let x = start - this.xOffset;
            x = (xOffsetEnd - this.xOffset) - x - this.itemWidth;
            scaledX = x * scale;
        } else {
            scaledX = (start - this.xOffset) * scale;
        }
        return parseInt(Math.round(scaledX));
    }

    getWidth(scale) {
        return Math.max(1, parseInt(Math.round(this.itemWidth * scale)));
    }
}


export class OverlappingList {
    constructor(items) {
        this.items = items || [];
    }

    add(item) {
        this.items.push(item);
    }

    flatten() {
        this.addChildren();
        return this.items;
    }

    toString() {
        return OverlappingList.itemAryToString(this.items);
    }

    static itemAryToString(items) {
        let result = '';
        for (let item of items) {
            result += OverlappingList.itemToString(item);
        }
        return result;
    }

    static itemToString(item) {
        let result = '';
        result += "[" + item.start + "," + item.end + " children_len:" + item.children.length;
        result += "]  ";
        return result;
    }

    static itemsOverlap(x, y) {
        return x.start < y.end && y.start < x.end
    }

    addChildren() {
        for (let item of this.items) {
            let children = [];
            for (let sibling of this.items) {
                if (OverlappingList.itemsOverlap(item, sibling)) {
                    children.push(sibling);
                }
            }
            children.sort(sortByStart);
            item.children = children;
        }
    }
}

export default HeatMapData;
