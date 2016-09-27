import React from 'react';
require("./BooleanInput.css");

class BooleanInput extends React.Component {
    constructor(props) {
        super(props);
    }

    onChange = (evt) => {
        this.props.onChange(evt.target.checked);
    };

    render() {
        return <label className="BooleanInput_label">
                    <input type="checkbox"
                           checked={this.props.checked}
                           onChange={this.onChange}
                    /> {this.props.label}
            </label>
    }
}

export default BooleanInput;