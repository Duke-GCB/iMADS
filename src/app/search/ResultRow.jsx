import React from 'react';
import HeaderCell from '../common/HeaderCell.jsx'
import ListHeader from '../common/ListHeader.jsx'

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

function getTitles(rangeType, includeValues) {
    let list = NormalColumnData.slice(0);
    if (rangeType) {
        list = RangeColumnData.slice(0);
    }
    if (includeValues) {
        list.push(ValuesColumnData);
        return list.map(getNormalWidthAndTitle);
    } else {
        return list.map(getWideWidthAndTitle);
    }
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
        return <HeaderCell width={headerInfo.width}>{headerInfo.title}</HeaderCell>
    }
    render() {
        let {rangeType, includeValues} = this.props;
        let cells = getTitles(rangeType, includeValues).map(this.makeHeader);
        return <ListHeader>
            {cells}
        </ListHeader>
    }
}

/*
let columnHeaders;
        if (isCustomRange) {
            columnHeaders = <ListHeader>
                                  <span className={"HeaderCell IdCellWide"}>Name</span>
                                  <span className="HeaderCell NumberCell">Max</span>
                                  {heatMapHeader}
                            </ListHeader>
        } else {
            columnHeaders = <ListHeader >

                                  <span className={"HeaderCell NameCell" + cellExtraClassName}>Name</span>
                                  <span className={"HeaderCell IdCell" + cellExtraClassName}>ID</span>
                                  <span className={"HeaderCell StrandCell" + cellExtraClassName}>Strand</span>
                                  <span className={"HeaderCell ChromCell" + cellExtraClassName}>Chromosome</span>
                                  <span className="HeaderCell NumberCell">Start</span>
                                  <span className="HeaderCell NumberCell">End</span>
                                  <span className="HeaderCell NumberCell">Max</span>
                                  {heatMapHeader}
                            </ListHeader>
        }
 */


export class ResultDetailRow extends React.Component {
    render() {
        return <div>Detail</div>
    }
}