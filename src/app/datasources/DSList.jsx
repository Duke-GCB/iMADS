import React from 'react';
import PageTitle from '../common/PageTitle.jsx'

class DSList extends React.Component {
    render() {
        return <div>
            <PageTitle>{this.props.title}</PageTitle>
            <div className="listHeader" >
                <span className="table_header_cell table_cell_medium">Description</span>
                <span className="table_header_cell table_cell_small">Downloaded</span>
                <span className="table_header_cell table_cell_large">URL</span>
            </div>
            {this.props.content}
        </div>
    }
}

export default DSList;