import React from 'react';
require('./ContactEmail.css');

export default class ContactEmail extends React.Component {
    render() {
        let {email, message} = this.props;
        let mailto = 'mailto:' + email;
        if (!message) {
            message = 'Contact email: ';
        }
        return <div className="ContactEmail_container">
            <span className="ContactEmail_text">{message}<a href={mailto}>{email}</a></span>
        </div>;
    }
}
