import React from 'react';
require('./TextEdit.css');

export default class TextEdit extends React.Component {
    render() {
        let {title, placeholder, value, onChange, size, disabled} = this.props;
        return <div>
                    <label className="TextEdit_label">{title}
                        <input type="text"
                               disabled={disabled}
                               placeholder={placeholder}
                               value={value}
                               size={size}
                               onChange={onChange} />
                    </label>
                </div>;
    }
}