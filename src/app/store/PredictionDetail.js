// Allows user to create list of various properties based a list of bed file predictions.

function sortByStart(a, b) {
    if (a.start < b.start) {
        return -1;
    }
    if (a.start > b.start) {
        return 1;
    }
    return 0;
}

export default class PredictionDetail {
    constructor() {

    }

    // return array of details for each value in rowData
    getDetails(rowData, chrom, selectedIndex) {
        let result = [];
        let sortedValues = rowData.values.slice();
        sortedValues.sort(sortByStart);
        for (let i = 0; i < sortedValues.length; i++) {
            let prediction = sortedValues[i];
            result.push(this.makeDetail(prediction, chrom, i == selectedIndex));
        }
        return result;
    }

    makeDetail(prediction, chrom, isSelected) {
            let start = parseInt(prediction.start) + 1;
            let position = chrom + ":" + start + '-' + prediction.end;
            let rowClassName = "";
            if (isSelected) {
                rowClassName = "active";
            }
            return {
                rowClassName: rowClassName,
                position: position,
                chrom: chrom,
                start: start,
                end: prediction.end,
                value: prediction.value,
            };
    }

    // given a detail object from getDetails lookup sequence from a dictionary of ranges with position keys
    getSeqFromRanges(detailObject, ranges) {
        let position = detailObject.position;
        if (position in ranges) {
            return ranges[position];
        }
        return '';
    }

    // given a detail object from getDetails lookup sequence from a parent sequence
    getSeqFromParentSequence(detailObject, parentSequence) {
        let start = detailObject.start;
        let end = detailObject.end;
        // substring get back to original start
        return parentSequence.substring(start - 1, end);
    }

}



