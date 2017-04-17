import React from 'react';
require('./WideButton.css');

export default class WideButton extends React.Component {
    render() {
        let {title, onClick, emphasis} = this.props;
        let buttonClassName = "btn btn-default WideButton_button";
        if (emphasis) {
            buttonClassName += " WideButton_emphasis";
        }
        return <button type="button"
                       className={buttonClassName}
                       onClick={onClick} >{title}</button>;
    }
}