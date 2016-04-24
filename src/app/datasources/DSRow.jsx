import React from 'react';

class DataSourceRow extends React.Component {
    render() {
        var nameLink = <a href={this.props.fullUrl}>{this.props.cleanUrl}</a>;
        return <div className="table_row">
            <span className="table_cell table_cell_medium">{this.props.description}</span>
            <span className="table_cell table_cell_small">{this.props.downloaded}</span>
            <span className="table_cell table_cell_large">{nameLink}</span>
        </div>
    }
}

export default DataSourceRow;