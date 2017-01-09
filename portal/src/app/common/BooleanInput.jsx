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
        return <div>
                <label className="BooleanInput_label">
                        <input type="checkbox"
                               checked={this.props.checked}
                               onChange={this.onChange}
                        /> {this.props.label}
                </label>
            </div>
    }
}

export default BooleanInput;