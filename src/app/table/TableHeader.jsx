import React from 'react';

class TableHeader extends React.Component {
    render() {
        return <div style={{backgroundColor: '#235f9c', color: 'white'}} >
                    {this.props.children}
                </div>
    }
}

export default TableHeader;