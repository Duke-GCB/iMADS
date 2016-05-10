import React from 'react';

class DataCell extends React.Component {
    render() {
        let {style} = this.props;
        let combinedStyle = Object.assign(defaultStyle, style);
        return <span style={combinedStyle}>
            {this.props.children}
        </span>
    }
}

let defaultStyle = {
    display: 'inline-block',
    textOverflow: 'ellipsis',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
    verticalAlign: 'top',
};

export default DataCell;