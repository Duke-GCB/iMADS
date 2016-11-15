import React from 'react';
require('./ErrorMessage.css');

export default class ErrorMessage extends React.Component {
    render() {
        let {message} = this.props;
        return <span className="ErrorMessage_text">{message}</span>
    }
}
