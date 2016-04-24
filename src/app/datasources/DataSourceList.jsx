import React from 'react';
import PageTitle from '../common/PageTitle.jsx'
import TableHeader from '../common/TableHeader.jsx'
import TableCell from '../common/TableCell.jsx'

class DataSourceList extends React.Component {
    constructor(props) {
        super(props);
        this.smallWidth = {width:'14vw'};
        this.mediumWidth = {width:'20vw'};
        this.largeWidth = {width:'30vw'};
    }

    render() {
        return <div>
            <PageTitle>{this.props.title}</PageTitle>
            <TableHeader>
                <TableCell name="Description" style={this.mediumWidth} className="table_header_cell"/>
                <TableCell name="Downloaded" style={this.smallWidth} className="table_header_cell"/>
                <TableCell name="URL" style={this.largeWidth} className="table_header_cell"/>
            </TableHeader>
            {this.props.content}
        </div>
    }
}

export default DataSourceList;