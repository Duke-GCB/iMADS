import React from 'react';
require('./ColorPicker.css');

class ColorPickerCell extends React.Component {
    onClick = () => {
        let {colorName, onClickCell, disabled} = this.props;
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
        let {label, labelTitle, color, disabled} = this.props;
        console.log(disabled);
        let stuff = [];
        if (disabled) {
            return <div>
                <label title={labelTitle}>{label}</label>
                <button className="ColorPicker_button"
                        style={{backgroundColor: color, border: "1px solid lightGrey"}}
                        title={labelTitle}
                        disabled></button>
            </div>
        }
        return <div className="dropdown">
            <label title={labelTitle}>{label}</label>
            <button className="ColorPicker_button dropdown-toggle"
                    data-toggle="dropdown"
                    style={{backgroundColor: color}}
                    title={labelTitle}
            ></button>
            {stuff}
            <div className="ColorPicker_popup dropdown-menu">
                <ColorPickerCell colorName="red" onClickCell={this.onClickCell} />
                <ColorPickerCell colorName="green" onClickCell={this.onClickCell} />
                <ColorPickerCell colorName="blue" onClickCell={this.onClickCell} />
            </div>
        </div>;
    }
}
