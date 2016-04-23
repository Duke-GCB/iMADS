import React from 'react';

class TableCell extends React.Component {
    render() {
        var className = 'table_cell';
        if (this.props.className) {
            className = this.props.className;
        }
        return <span style={this.props.style} className={className}>{this.props.name}</span>
    }
}

export default TableCell;