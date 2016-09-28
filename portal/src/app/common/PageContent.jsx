import React from 'react';
require('./PageContent.css');

class PageContent extends React.Component {
    render() {
        return <div className="PageContent_div">
                {this.props.children}
            </div>
    }
}

export default PageContent;