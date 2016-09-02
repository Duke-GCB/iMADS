import React from 'react';

class BooleanInput extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);

    }
    onChange(evt) {
        this.props.onChange(evt.target.checked);
    }
    render() {
        return <label >
                    <input type="checkbox"
                           checked={this.props.checked} onChange={this.onChange}
                    /> {this.props.label}
            </label>
    }
}

export default BooleanInput;