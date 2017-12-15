import React from 'react';

export default class RadioButton extends React.Component {
    render() {
        let {name, label, value, selectedValue, onChangeSelectedValue, isDisabled} = this.props
        return <div className="radio">
            <label disabled={isDisabled}>
                <input type="radio" name={name}
                       disabled={isDisabled}
                       value={value} checked={selectedValue === value}
                       onChange={onChangeSelectedValue}>
                    {label}
                </input>
            </label>
        </div>
    }
}
