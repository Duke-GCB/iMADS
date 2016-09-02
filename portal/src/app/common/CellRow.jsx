import React from 'react';

class CellRow extends React.Component {
    render() {
        return <div style={style}>
            {this.props.children}
        </div>
    }
}

let style = {
    borderBottom: '1px solid grey',
}

export default CellRow;