import React from 'react';
require('./TextEdit.css');

export default class TextEdit extends React.Component {
    render() {
        let {title, placeholder, value, onChange, size} = this.props;
        return <div>
                    <label className="TextEdit_label">{title}
                        <input type="text"
                               placeholder={placeholder}
                               value={value}
                               size={size}
                               onChange={onChange} />
                    </label>
                </div>;
    }
}