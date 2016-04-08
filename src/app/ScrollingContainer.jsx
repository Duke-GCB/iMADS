import React from 'react';

class ScrollingContainer extends React.Component {
    render() {
        return <div id="scrolling_div_container" style={{height:this.props.height}}>
                        <div id="scrolling_div_child">
                            {this.props.children}
                            </div>
            </div>
    }
}

export default ScrollingContainer;