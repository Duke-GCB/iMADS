import React from 'react';
import SelectItem from '../common/SelectItem.jsx'
import WideButton from '../common/WideButton.jsx';
import BooleanInput from '../common/BooleanInput.jsx'
import TFColorPickers from '../common/TFColorPickers.jsx'
let moment = require('moment');

/**
 * Allows user to select model, dna sequence and other settings.
 * User can upload a custom s
 */
class PredictionFilterPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    onSelectCustomResult = (e) => {
        let value = e.target.value;
        let {customResultList} = this.props;
        for (let customResult of customResultList) {
            if (customResult.resultId == value) {
                this.props.setPredictionSettings({
                    selectedSequence: customResult.sequenceId,
                    model: customResult.modelName
                });
                return;
            }
        }
    };

    createMorePredictions = () => {
        this.props.showUploadSequencePane(true);
    };

    editExistingSequence = () => {
        this.props.showUploadSequencePane(false);
    };


    onChangeAll = (value) => {
        this.props.setPredictionSettings({all: value});
    };

    onChangeMaxPredictionSort = (value) => {
        this.props.setPredictionSettings({maxPredictionSort: value});
    };

    makeCustomResultListOptions() {
        let {customSequenceList, customResultList} = this.props;

        let customResultListOptions = [];

        for (let customResult of customResultList) {
            let label = customResult.title;
            let value = customResult.resultId;
            customResultListOptions.push(<option key={value} value={value}>{label}</option>);
        }
        return customResultListOptions;
    }

    findSelectedCustomResult() {
        let {customResultList, predictionSettings} = this.props;
        for (let customResult of customResultList) {
            if (customResult.sequenceId == predictionSettings.selectedSequence &&
                customResult.modelName == predictionSettings.model) {
                return customResult.resultId;
            }
        }
        return undefined;
    }

    render() {
        let {predictionColor, setPredictionColor, predictionSettings,
            customSequenceList, showTwoColorPickers} = this.props;
        let customResultListOptions = this.makeCustomResultListOptions();
        let editSequenceButton = [];
        let selectedCustomResult = this.findSelectedCustomResult();
        if (selectedCustomResult) {
            editSequenceButton = <WideButton title="Edit Prediction" onClick={this.editExistingSequence} />
        }
        return <div>
            <h4>Filter</h4>

            <SelectItem title="Protein/Model + DNA:"
                        selected={selectedCustomResult}
                        options={customResultListOptions}
                        onChange={this.onSelectCustomResult}
                        />
            {editSequenceButton}

            <BooleanInput checked={predictionSettings.maxPredictionSort}
                          label="Sort by max value"
                          onChange={this.onChangeMaxPredictionSort}/>
            <BooleanInput checked={predictionSettings.all} label="All values (heatmap)"
                          onChange={this.onChangeAll}/>
            <TFColorPickers showTwoPickers={showTwoColorPickers}
                            predictionColor={predictionColor}
                            setPredictionColor={setPredictionColor} />

            <WideButton title="Create More Predictions" onClick={this.createMorePredictions} emphasis={true} />
        </div>
    }
}
export default PredictionFilterPanel;
