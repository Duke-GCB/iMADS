import React from 'react';
import StreamValue from '../models/StreamValue.js'

class StreamInput extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.state = {
            isValid: true,
        }
    }

    onChange(evt) {
        let streamValue = new StreamValue(this.props.maxBindingOffset)
        let isValid = streamValue.isValid(evt.target.value);
        this.setState({
            isValid: isValid,
        })
        this.props.onChange(evt);
     }

    render() {
        let className = "form-control";
        if (!this.state.isValid) {
            className += " badValue"
        }
        return <div>
                    <label>{this.props.title}
                        <input type="text"
                               disabled={this.props.disabled}
                               className={className}
                               defaultValue={this.props.value}
                               onBlur={this.onChange}
                        />

                    </label>
                </div>
    }
}

export default StreamInput;