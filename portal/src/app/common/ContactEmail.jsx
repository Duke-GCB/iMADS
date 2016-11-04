import React from 'react';
require('./ContactEmail.css');

export default class ContactEmail extends React.Component {
    render() {
        let {email} = this.props;
        let mailto = 'mailto:' + email;
        let message = 'Contact email: ';
        return <footer className="ContactEmail_container">
            <span className="ContactEmail_text">{message}<a href={mailto}>{email}</a></span>
        </footer>;
    }
}