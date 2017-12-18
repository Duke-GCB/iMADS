import React from 'react';
import ColorPicker from './ColorPicker.jsx';

export default class TFColorPickers extends React.Component {
    setPredictionColor1 = (colorName) => {
        this.setColors(colorName, this.props.predictionColor.color2);
    };

    setPredictionColor2 = (colorName) => {
        this.setColors(this.props.predictionColor.color1, colorName);
    };

    setColors = (color1, color2) => {
        let {setPredictionColor} = this.props;
        setPredictionColor(TFColorPickers.makeColorObj(color1, color2));
    };

    render() {
        let {predictionColor, showTwoPickers} = this.props;
        if (showTwoPickers) {
            return <div>
                <ColorPicker label="TF1-preferred:"
                             helpText="Binding sites with higher specificity for TF1 compared to TF2"
                             color={predictionColor.color1}
                             setColor={this.setPredictionColor1} />
                <ColorPicker label="TF2-preferred:"
                             helpText="Binding sites with higher specificity for TF2 compared to TF1"
                             color={predictionColor.color2}
                             setColor={this.setPredictionColor2} />
                <ColorPicker label="Same preference:"
                             helpText="Binding sites with similar specificity for TF1 and TF2"
                             color="gray"
                             disabled={true}
                />
                </div>;
        } else {
            return <div>
                <ColorPicker label="TF Color:"
                             color={predictionColor.color1}
                             setColor={this.setPredictionColor1} />
            </div>;
        }
    }

    static makeColorObj(color1, color2) {
        return {
            color1: color1,
            color2: color2
        };
    }

    static defaultColorObj() {
        return TFColorPickers.makeColorObj("red", "blue");
    }
}
