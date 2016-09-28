import React from 'react';
require('./WideButton.css');

export default class WideButton extends React.Component {
    render() {
        let {title, onClick} = this.props;
        return <button type="button"
                       className="btn btn-default btn-sm WideButton_button"
                       onClick={onClick} >{title}</button>;
    }
}