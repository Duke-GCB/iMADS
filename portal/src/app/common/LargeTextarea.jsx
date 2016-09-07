import React from 'react';
require('./LargeTextarea.css');

class LargeTextarea extends React.Component {
    constructor(props) {
        super(props);
    }

    onChangeValue = (evt) => {
        let {onChange} = this.props;
        onChange(evt.target.value);
    };

    render() {
        let {placeholder, value, disabled} = this.props;
        return  <textarea className="LargeTextarea"
                    placeholder={placeholder}
                    value={value}
                    onChange={this.onChangeValue}
                    disabled={disabled} >
                </textarea>
    }
}

export default LargeTextarea;