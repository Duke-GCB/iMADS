import React from 'react';

class HeaderCell extends React.Component {
    render() {
        let {width} = this.props;
        let combinedStyle = Object.assign({}, style, {width: width});
        return <span style={combinedStyle}>
            {this.props.children}
        </span>
    }
}

let style = {
    padding: '10px',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '16px',
    letterSpacing: '0.0625em',
};

export default HeaderCell;

