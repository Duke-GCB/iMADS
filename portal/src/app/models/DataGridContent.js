
const TEXT_TYPE = "text";
const HEATMAP_TYPE = "heatmap";
const LINK_TYPE = "link";

/**
 * Adds column info to each value in data grid including the appropriate className to use for header and data cells.
 */
class DataGridContent {
    constructor() {
        this.columns = [];
        this.data = [];
    }

    getNumColumns() {
        return this.columns.length;
    }

    addColumn(title, fieldName, type, makeControlFunc) {
        this.columns.push({
            title: title,
            fieldName: fieldName,
            type: type,
            makeControlFunc: makeControlFunc
        });
    }

    addData(obj) {
        let valueAry = []
        for (let column of this.columns) {
            let value = obj[column.fieldName];
            if (column.type != TEXT_TYPE) {
                value = obj;
            }
            valueAry.push({
                value: value,
                column: column
            });
        }
        this.data.push(valueAry);
    }

    getColumnHeaders() {
        return this.columns;
    }

    getRows() {
        return this.data;
    }

}

export {DataGridContent, TEXT_TYPE, HEATMAP_TYPE, LINK_TYPE};