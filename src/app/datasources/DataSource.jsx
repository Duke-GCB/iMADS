import React from 'react';
import PageTitle from '../common/PageTitle.jsx'
import ListHeader from '../common/ListHeader.jsx'
import HeaderCell from '../common/HeaderCell.jsx'
import CellRow from '../common/CellRow.jsx'
import DataCell from '../common/DataCell.jsx'

class DataSource extends React.Component {
    makeHeader() {
        return <ListHeader>
            <HeaderCell width={MEDIUM_WIDTH}>Description</HeaderCell>
            <HeaderCell width={SMALL_WIDTH}>Downloaded</HeaderCell>
            <HeaderCell width={LARGE_WIDTH}>URL</HeaderCell>
        </ListHeader>
    }

    makeRow(item) {
        let {fullUrl, cleanUrl, description, downloaded} = item;
        let nameLink = <a href={fullUrl}>{cleanUrl}</a>;
        return <CellRow>
            <DataCell width={MEDIUM_WIDTH}>{description}</DataCell>
            <DataCell width={SMALL_WIDTH}>{downloaded}</DataCell>
            <DataCell width={LARGE_WIDTH}>{nameLink}</DataCell>
        </CellRow>
    }

    render() {
        let {title, content} = this.props;
        let header = this.makeHeader();
        let contentRows = content.map(this.makeRow);
        return <div>
            <PageTitle>{title}</PageTitle>
            {header}
            {contentRows}
        </div>
    }
}

let SMALL_WIDTH = '14vw';
let MEDIUM_WIDTH = '20vw';
let LARGE_WIDTH = '30vw';

export default DataSource;