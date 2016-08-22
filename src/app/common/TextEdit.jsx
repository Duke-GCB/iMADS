import React from 'react';
require('./TextEdit.css');

export default class TextEdit extends React.Component {

    render() {
        let {title, placeholder, value, onChange, size, maxlength, disabled, errorMessage} = this.props;
        let textClassName = "TextEdit_label";
        if (errorMessage) {
            textClassName += " TextEdit_label_error ";
        }
        return <div>
                    <label className="TextEdit_label">{title}
                        <input className={textClassName}
                               type="text"
                               disabled={disabled}
                               placeholder={placeholder}
                               defaultValue={value}
                               size={size}
                               maxLength={maxlength}
                               onChange={onChange} />
                    </label>
                    <span className="TextEdit_errorMessage">{errorMessage}</span>
                </div>;
    }
}