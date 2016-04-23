import React from 'react';

class TableRow extends React.Component {
    render() {
        return <div className="table_row">
                    {this.props.children}
                </div>
    }
}

export default TableRow;