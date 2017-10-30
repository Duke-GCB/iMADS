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
                <ul style={{listStyle: "none", paddingLeft: "2em"}}>
                    <li>
                        <ColorPicker label="TF1-preferred:"
                                     labelTitle="Binding sites with higher specificity for TF1 compared to TF2"
                                     color={predictionColor.color1}
                                     setColor={this.setPredictionColor1}/>
                    </li>
                    <li>
                        <ColorPicker label="TF2-preferred:"
                                     labelTitle="Binding sites with higher specificity for TF2 compared to TF1"
                                     color={predictionColor.color2}
                                     setColor={this.setPredictionColor2}/>
                    </li>
                    <li>
                        <ColorPicker label="Same preference:"
                                     labelTitle="Binding sites with similar specificity for TF1 and TF2"
                                     color="LightGray"
                                     disabled={true}/>
                    </li>
                </ul>
            </div>;
        } else {
            return <div>
                <ul style={{listStyle: "none", paddingLeft: "2em"}}>
                    <li>
                        <ColorPicker label="TF Color:"
                                     color={predictionColor.color1}
                                     setColor={this.setPredictionColor1}/>
                    </li>
                </ul>
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
