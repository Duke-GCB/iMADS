import React from 'react';
import {DataGridContent, TEXT_TYPE} from '../store/DataGridContent.js'
import LabeledLoader from '../common/LabeledLoader.jsx'
import ErrorPanel from '../search/ErrorPanel.jsx'
import ProgressTable from '../common/ProgressTable.jsx'

/**
 * Row that fills the body of the DataGrid.
 */
class TallRow extends React.Component {
    render() {
        let {numColumns, children} = this.props;
        return <tr>
            <td colSpan={numColumns}>
                {children}
            </td>
        </tr>;
    }
}

export default class DataGrid extends React.Component {

    createDataGridContent = () => {
        let {columnInfo, rows} = this.props;
        let dataGridContent = new DataGridContent();
        for (let column of columnInfo) {
            dataGridContent.addColumn(column.title, column.fieldName, column.type, column.makeControlFunc);
        }
        for (let row of rows) {
            dataGridContent.addData(row);
        }
        return dataGridContent;
    }

    makeHeaders = (dataGridContent) => {
        let headers = [];
        let key = 1;
        for (let columnHeader of dataGridContent.getColumnHeaders()) {
            let headerClassName = this.makeClassName("header_" + columnHeader.fieldName);
            headerClassName += " " + this.makeClassName("headerCell");
            let keyStr = headerClassName + key;
            headers.push(<td key={keyStr} className={headerClassName}>
                {columnHeader.title}
            </td>);
            key += 1;
        }
        let headerSpacerClassName = this.makeClassName("headerCell");
        let keyStr = this.makeClassName("header_spacer") + key;
        headers.push(<td className={headerSpacerClassName} key={keyStr}></td>);
        return headers;
    };

    makeTableContent = (dataGridContent) => {
        let {errorMessage, searchDataLoaded, loadingStatusLabel, startedSearch, showBlankWhenEmpty} = this.props;
        let numColumns = dataGridContent.getNumColumns() + 1;
        if (!searchDataLoaded) {
            return <TallRow numColumns={numColumns}>
                <ProgressTable startedDate={startedSearch} status={loadingStatusLabel} />
            </TallRow>;
        }
        if (errorMessage) {
            return <TallRow numColumns={numColumns}>
                <ErrorPanel message={errorMessage}/>
            </TallRow>;
        }
        let rowContent = dataGridContent.getRows();
        if (rowContent.length == 0) {
            let message = "No results found.";
            if (showBlankWhenEmpty) {
                message = "";
            }
            return <TallRow numColumns={numColumns}>
                <div className="centerChildrenHorizontally">
                    <span className="centerVertically">{message}</span>
                </div>
            </TallRow>;
        }
        return this.makeRows(dataGridContent, rowContent);
    };

    makeRows = (dataGridContent, rowContent) => {
        let rows = [];
        let key = 1;
        for (let row of rowContent) {
            rows.push(this.makeRow(row, key));
            key += 1;
        }
        rows.push(<tr key="DataGrid_spacer_row">
            <td></td>
        </tr>);//spacer row
        return rows;
    }

    makeRow = (row, rowKey) => {
        let items = [];
        let dataRowClassName = this.makeClassName("dataRow");
        let key = 1;
        for (let item of row) {
            let itemClassName = this.makeClassName(item.column.fieldName);
            itemClassName += ' ' + this.makeClassName('dataCell');
            let itemControl = item.value;
            if (item.column.makeControlFunc) {
                itemControl = item.column.makeControlFunc(item.value);
            }
            let keyStr = itemClassName + key;
            let title="";
            if (item.column.type == TEXT_TYPE) {
                title = itemControl;
            }
            items.push(<td title={title} key={keyStr} className={itemClassName}>{itemControl}</td>);
            key += 1;
        }
        let itemClassName = this.makeClassName('dataCell');
        let keyStr = itemClassName + key;
        items.push(<td key={keyStr} className={itemClassName}></td>);

        let rowKeyStr = dataRowClassName + rowKey;
        return <tr key={rowKeyStr} className={dataRowClassName}>{items}</tr>;
    }

    makeClassName = (name) => {
        let {classNamePrefix} = this.props;
        return classNamePrefix + name;
    }

    render() {
        let {errorMessage, searchDataLoaded, loadingStatusLabel} = this.props;
        let content = this.createDataGridContent();
        let headers = this.makeHeaders(content);
        let tableContent = this.makeTableContent(content);
        let tableClassName = this.makeClassName("table");
        let headerRowClassName = this.makeClassName("headerRow")
        return <table className={tableClassName}>
            <thead>
            <tr className={headerRowClassName}>
                {headers}
            </tr>
            </thead>
            <tbody>
            {tableContent}
            </tbody>
        </table>
    }
}