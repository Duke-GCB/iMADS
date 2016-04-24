import React from 'react';
import TableCell from '../common/TableCell.jsx'
import TableRow from '../common/TableRow.jsx'

class DataSourceRow extends React.Component {
    constructor(props) {
        super(props);
        this.smallWidth = {width: '14vw'};
        this.mediumWidth = {width: '20vw'};
        this.largeWidth = {width: '30vw'};
    }

    render() {
        var nameLink = <a href={this.props.fullUrl}>{this.props.cleanUrl}</a>;
        return <TableRow>
            <TableCell name={this.props.description} style={this.mediumWidth}></TableCell>
            <TableCell name={this.props.downloaded} style={this.smallWidth}></TableCell>
            <TableCell name={nameLink} style={this.largeWidth}></TableCell>
        </TableRow>
    }
}

export default DataSourceRow;