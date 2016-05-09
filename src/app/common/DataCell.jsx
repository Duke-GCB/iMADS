import React from 'react';

class DataCell extends React.Component {
    render() {
        let {width} = this.props;
        let combinedStyle = Object.assign(style, {width: width});
        return <span style={combinedStyle}>
            {this.props.children}
        </span>
    }
}

let style = {
    padding: '10px',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
    verticalAlign: 'top',
};

export default DataCell;