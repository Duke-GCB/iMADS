import React from 'react';

class ListHeader extends React.Component {
    render() {
        return <div style={style}>
            {this.props.children}
        </div>
    }
}

let style = {
    backgroundColor: '#235f9c',
    color: 'white',
}

export default ListHeader;