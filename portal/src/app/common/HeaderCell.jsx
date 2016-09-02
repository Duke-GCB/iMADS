import React from 'react';

class HeaderCell extends React.Component {
    render() {
        let {width, centerText} = this.props;
        let combinedStyle = Object.assign({}, style, {width: width});
        if (centerText) {
            combinedStyle['textAlign'] = 'center';
        }
        return <span style={combinedStyle}>
            {this.props.children}
        </span>
    }
}

let style = {
    paddingTop: '10px',
    paddingBottom: '10px',
    display: 'inline-block',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '16px',
    letterSpacing: '0.0625em',
};

export default HeaderCell;

