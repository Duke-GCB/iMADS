/*
 * ResultHeaderRow and ResultDetailRow - together display table of results from a prediction query.
 * Contains settings so the headers in ResultHeaderRow match up with ResultDetailRow.
*/
import React from 'react';
import ListHeader from '../common/ListHeader.jsx'
import HeaderCell from '../common/HeaderCell.jsx'
import DataCell from '../common/DataCell.jsx'

const RangeColumnData = [
    {
        title:"Name",
        normalWidth: '24%'
    },
    {
        title: "Max",
        normalWidth: "10%"
    }
];

const NormalColumnData = [
    {
        title:"Name",
        wideWidth: '18%',
        normalWidth: '16%'
    },
    {
        title:"ID",
        wideWidth: '24%',
        normalWidth: '20%'
    },
    {
        title:"Strand",
        wideWidth: '10%',
        normalWidth: '8%'
    },
    {
        title:"Chromosome",
        wideWidth: '16%',
        normalWidth: '8%'
    },
    {
        title:"Start",
        normalWidth: '10%'
    },
    {
        title:"End",
        normalWidth: '10%'
    },
    {
        title:"Max",
        normalWidth: '10%'
    },
];

const ValuesColumnData = {
    title: "Values",
    normalWidth: '100px',
};

function getTitles(rangeType, includeHeatMap) {
    let list = NormalColumnData.slice(0);
    if (rangeType) {
        list = RangeColumnData.slice(0);
    }
    if (includeHeatMap) {
        list.push(ValuesColumnData);
        return list.map(getNormalWidthAndTitle);
    } else {
        return list.map(getWideWidthAndTitle);
    }
}

function getColumnWidths(rangeType, includeHeatMap) {
    return getTitles(rangeType, includeHeatMap).map(function (columnInfo) {
        return columnInfo.width;
    })
}

function getWidthAndTitle(columnInfo, wideMode) {
    let width = columnInfo.normalWidth;
    if (wideMode && columnInfo.wideWidth) {
        width = columnInfo.wideWidth;
    }
    return {
        title: columnInfo.title,
        width: width
    };
}

function getNormalWidthAndTitle(columnInfo) {
    let width = columnInfo.normalWidth;
    return {
        title: columnInfo.title,
        width: width
    };
}

function getWideWidthAndTitle(columnInfo) {
    let width = columnInfo.normalWidth;
    if (columnInfo.wideWidth) {
        width = columnInfo.wideWidth;
    }
    return {
        title: columnInfo.title,
        width: width
    };
}

export class ResultHeaderRow extends React.Component {
    makeHeader(headerInfo) {
        return <HeaderCell key={headerInfo.title} width={headerInfo.width}>{headerInfo.title}</HeaderCell>
    }
    render() {
        let {rangeType, includeHeatMap} = this.props;
        let cells = getTitles(rangeType, includeHeatMap).map(this.makeHeader);
        return <ListHeader>
            {cells}
        </ListHeader>
    }
}

export class ResultDetailRow extends React.Component {

    determineValues() {
        let {rowData, heatMap, rangeType, includeHeatMap} = this.props;
        let values = [];
        if (rangeType) {
            values.push(rowData.chrom + ':' + rowData.start + '-' + rowData.end);
            values.push(rowData.max);
        } else {
            values.push(rowData.commonName);
            values.push(rowData.name);
            values.push(rowData.strand);
            values.push(rowData.chrom);
            values.push(rowData.start);
            values.push(rowData.end);
            values.push(rowData.max);
        }
        if (includeHeatMap) {
            values.push(heatMap);
        }
        return values;
    }

    makeDataCell(value, width) {
        return <DataCell width={width}>{value}</DataCell>;
    }

    render() {
        let {rangeType, includeHeatMap} = this.props;
        let values = this.determineValues();
        let widths = getColumnWidths(rangeType, includeHeatMap);

        let rows = [];
        for (let i = 0; i < values.length; i++) {
            let style = {
                width: widths[i],
                height: DATA_CELL_ROW_HEIGHT
            }
            if (i == 0) {
                style['paddingLeft'] = DATA_CELL_LEFT_PADDING;
            }
            rows.push(<DataCell key={i} style={style}>{values[i]}</DataCell>);
        }
        return <div style={dataCellStyle}>{rows}</div>
    }
}

const DATA_CELL_ROW_HEIGHT = "20px";
const DATA_CELL_LEFT_PADDING = "10px";
let dataCellStyle = {
    borderBottom: '1px solid grey'
}