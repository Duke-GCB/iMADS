import React from 'react';

class DataCell extends React.Component {
    render() {
        let {style} = this.props;
        let combinedStyle = Object.assign({}, defaultStyle, style);
        return <div style={combinedStyle}>
            {this.props.children}
        </div>
    }
}

let defaultStyle = {
    display: 'inline-block',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
    verticalAlign: 'top',

};

export default DataCell;