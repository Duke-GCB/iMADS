import React from 'react';

class PageContent extends React.Component {
    render() {
        return <div style={style}>
                {this.props.children}
            </div>
    }
}

let marginSize = '30px';
let style = {
    marginLeft: marginSize,
    marginRight: marginSize,
    marginBottom: marginSize,
}

export default PageContent;