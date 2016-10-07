import React from 'react';
import {DataGridContent, TEXT_TYPE} from '../models/DataGridContent.js'
import ErrorPanel from '../search/ErrorPanel.jsx'
import ProgressTable from '../common/ProgressTable.jsx'
import Loader from 'react-loader';

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
        let {headerClassNamePrefix} = this.props;
        for (let columnHeader of dataGridContent.getColumnHeaders()) {
            let headerClassName = this.makeClassName("header_" + headerClassNamePrefix + columnHeader.fieldName);
            headerClassName += " " + this.makeClassName("headerCell");
            let keyStr = headerClassName + key;
            headers.push(<td key={keyStr} className={headerClassName}>
                {columnHeader.title}
            </td>);
            key += 1;
        }
        let headerSpacerClassName = this.makeClassName("header_spacer");
        headerSpacerClassName += " " + this.makeClassName("headerCell");
        let keyStr = this.makeClassName("header_spacer") + key;
        headers.push(<td className={headerSpacerClassName} key={keyStr}></td>);
        return headers;
    };

    makeTableContent = (dataGridContent) => {
        let {errorMessage, searchDataLoaded, loadingStatusLabel, jobDates,
            showBlankWhenEmpty, fullScreen} = this.props;
        let numColumns = dataGridContent.getNumColumns() + 1;
        if (!searchDataLoaded) {
            let content = <div className="centerChildrenHorizontally">
                            <span className="smallMargin">Loading...</span>
                        </div>;
            if (fullScreen) {
                content = <Loader loaded={false}></Loader>;
            }
            if (jobDates) {
                content =  <ProgressTable startedDate={jobDates.started}
                                          currentDate={jobDates.current}
                                          status={loadingStatusLabel}/>;
            }
            return <TallRow numColumns={numColumns}>
                {content}
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
            let messageStyle = "smallMargin";
            if (fullScreen) {
                messageStyle = "centerVertically";
            }
            return <TallRow numColumns={numColumns}>
                <div className="centerChildrenHorizontally">
                    <span className={messageStyle}>{message}</span>
                </div>
            </TallRow>;
        }
        return this.makeRows(dataGridContent, rowContent);
    };

    makeRows = (dataGridContent, rowContent) => {
        let {hasGroups} = this.props;
        let rows = [];
        let key = 1;
        let lastGroup = undefined;
        for (let row of rowContent) {
            if (hasGroups && lastGroup != row.groupName) {
                rows.push(this.makeGroupRow(key, row));
                lastGroup = row.groupName;
            }
            rows.push(this.makeRow(row, key));
            key += 1;
        }
        rows.push(<tr key="DataGrid_spacer_row">
            <td></td>
        </tr>);//spacer row
        return rows;
    };

    /**
     * Makes tr that contains a groupName to group items below it.
     */
    makeGroupRow = (key, row) => {
        let groupColSpan = row.length;
        let groupClassName = this.makeClassName("group");
        return <tr key={key}>
            <td colSpan={groupColSpan}>
                <div className={groupClassName}>{row.groupName}</div>
            </td>
        </tr>;
    };

    makeRow = (row, rowKey) => {
        let items = [];
        let dataRowClassName = this.makeClassName("dataRow");
        let key = 1;
        for (let item of row) {
            let itemClassName = this.makeClassName(item.column.fieldName);
            itemClassName += ' ' + this.makeClassName('dataCell');
            let itemControl = item.value;
            if (item.column.makeControlFunc) {
                itemControl = item.column.makeControlFunc(item.value, rowKey);
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
    };

    makeClassName = (name) => {
        let {classNamePrefix} = this.props;
        return classNamePrefix + name;
    };

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