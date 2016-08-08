import React from 'react';
require('./ColorPicker.css');

class ColorPickerCell extends React.Component {
    onClick = () => {
        let {colorName, onClickCell} = this.props;
        onClickCell(colorName);
    }
    render() {
        let {colorName} = this.props;
        let className = "ColorPicker_cell ColorPicker_" + colorName;
        return <button className={className} onClick={this.onClick} />
    }
}

export default class ColorPicker extends React.Component {
    onClickCell = (colorName) => {
        let {setColor} = this.props;
        setColor(colorName);
    }

    render() {
        let {label, color} = this.props;
        return <div className="dropdown">
            <label>{label}</label>
            <button className="ColorPicker_button dropdown-toggle"
                    data-toggle="dropdown"
                    style={{backgroundColor: color}}
            ></button>
            <div className="ColorPicker_popup dropdown-menu">
                <ColorPickerCell colorName="red" onClickCell={this.onClickCell} />
                <ColorPickerCell colorName="green" onClickCell={this.onClickCell} />
                <ColorPickerCell colorName="blue" onClickCell={this.onClickCell} />
            </div>
        </div>;
    }
}