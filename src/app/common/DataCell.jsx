import React from 'react';

class DataCell extends React.Component {
    render() {
        let {style, classNameStr} = this.props;
        let combinedStyle = Object.assign({}, defaultStyle, style);
        return <div className={classNameStr} style={combinedStyle}>
            {this.props.children}
        </div>
    }
}

let defaultStyle = {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '14px',
    verticalAlign: 'top',

};

export default DataCell;