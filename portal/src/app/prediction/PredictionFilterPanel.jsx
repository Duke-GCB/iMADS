import React from 'react';
import SelectItem from '../common/SelectItem.jsx'
import ModelSelect from '../common/ModelSelect.jsx';
import WideButton from '../common/WideButton.jsx';
import BooleanInput from '../common/BooleanInput.jsx'
import ArrowTooltip from '../common/ArrowTooltip.jsx'
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
            showCustomDialog: false,
            defaultCustomSequenceName: "",
            sequenceData: {}
        }
    }

    onChangeSequence = (e) => {
        let value = e.target.value;
        let {customResultList} = this.props;
        for (let customResult of customResultList) {
            if (customResult.resultId == value) {
                console.log(customResult);
                this.props.setPredictionSettings({
                    selectedSequence: customResult.sequenceId,
                    model: customResult.modelName
                });
                return;
            }
        }
        console.log("NADA");
    };

    editExistingSequence = () => {
        this.props.setShowInputPane(true);
        /*
        let {customSequenceList, predictionSettings} = this.props;
        let editSeqData = {};
        for (let seqData of customSequenceList) {
            if (seqData.id == predictionSettings.selectedSequence) {
                editSeqData = seqData;
                break;
            }
        }
        this.setState({
            showCustomDialog: true,
            defaultCustomSequenceName: this.makeDefaultCustomSequenceName(),
            sequenceData: editSeqData
        });
        */
    };

    makeDefaultCustomSequenceName = () => {
        return "Sequence List " + moment().format('MM/DD HH:mm');
    };

    closeCustomDialog = (seqId, errorMessage, title) => {
        if (seqId) {
            this.props.addCustomSeqenceList(seqId, title, this.state.sequenceData);
        }
        this.setState({
            showCustomDialog: false,
        });
    };

    onChangeModel = (e) => {
        let value = e.target.value;
        this.props.setPredictionSettings({model: value});
    };

    onChangeAll = (value) => {
        this.props.setPredictionSettings({all: value});
    };

    onChangeMaxPredictionSort = (value) => {
        this.props.setPredictionSettings({maxPredictionSort: value});
    };

    getModels() {
        let {genomeData}  = this.props;
        let models = [];
        if (genomeData) {
            let firstGenomeVersion = Object.keys(genomeData)[0];
            let genomeInfo = genomeData[firstGenomeVersion];
            if (genomeInfo) {
                models = genomeInfo.models;
            }
        }
        return models;
    }

    makeSequenceListOptions() {
        let {customSequenceList, customResultList} = this.props;

        let sequenceListOptions = [];

        for (let customResult of customResultList) {
            let label = customResult.title;
            let value = customResult.resultId;
            sequenceListOptions.push(<option key={value} value={value}>{label}</option>);
        }
        return sequenceListOptions;
    }

    findSelectedSequence() {
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
        let models = this.getModels();
        let sequenceListOptions = this.makeSequenceListOptions();
        let editSequenceButton = [];
        let selectedSequence = this.findSelectedSequence();
        if (selectedSequence) {
            editSequenceButton = <WideButton title="Edit Prediction" onClick={this.editExistingSequence} />
        }
        return <div>
            <h4>Filter</h4>

            <SelectItem title="Protein/Model + DNA:"
                        selected={selectedSequence}
                        options={sequenceListOptions}
                        onChange={this.onChangeSequence}
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

            <WideButton title="Create More Predictions" onClick={this.editExistingSequence} emphasis={true} />
        </div>
    }
}
/*
            <UploadSequenceDialog isOpen={this.state.showCustomDialog}
                                  defaultSequenceName={this.state.defaultCustomSequenceName}
                                  sequenceData={this.state.sequenceData}
                                  onRequestClose={this.closeCustomDialog} />
            <ModelSelect selected={predictionSettings.model}
                         models={models}
                         onChange={this.onChangeModel} />


 */
export default PredictionFilterPanel;
