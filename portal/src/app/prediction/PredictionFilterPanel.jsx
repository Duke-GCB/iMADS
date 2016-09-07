import React from 'react';
import SelectItem from '../common/SelectItem.jsx'
import ModelSelect from '../common/ModelSelect.jsx';
import BooleanInput from '../common/BooleanInput.jsx'
import ArrowTooltip from '../common/ArrowTooltip.jsx'
import TFColorPickers from '../common/TFColorPickers.jsx'
import UploadSequenceDialog from './UploadSequenceDialog.jsx'
let moment = require('moment');

const CUSTOM_SEQUENCE_LIST = 'Upload Custom Sequence';
const FIRST_TIME_INSTRUCTIONS = "Select '" + CUSTOM_SEQUENCE_LIST + "' to upload your first sequence.";

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
        if (value == CUSTOM_SEQUENCE_LIST) {
            this.setShowCustomDialog();
        } else {
            this.props.setPredictionSettings({selectedSequence: value});
        }
    };

    setShowCustomDialog = () => {
        this.setState({
            showCustomDialog: true,
            defaultCustomSequenceName: this.makeDefaultCustomSequenceName(),
            sequenceData: {}
        });
    };

    editExistingSequence = () => {
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
    }

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
        let {customSequenceList} = this.props;

        let sequenceListOptions = [];

        for (let idx = 0; idx < customSequenceList.length; idx++) {
            let label = customSequenceList[idx].title;
            let value = customSequenceList[idx].id;
            sequenceListOptions.push(<option key={value} value={value}>{label}</option>);
        }

        if (customSequenceList.length == 0) {
            sequenceListOptions.push(<option key=""></option>);
        }
        sequenceListOptions.push(<option key="customGeneList"  value={CUSTOM_SEQUENCE_LIST}>{CUSTOM_SEQUENCE_LIST}</option>);
        return sequenceListOptions;
    }

    render() {
        let {predictionColor, setPredictionColor, predictionSettings,
            customSequenceList, showTwoColorPickers} = this.props;
        let models = this.getModels();
        let sequenceListOptions = this.makeSequenceListOptions();
        let uploadInstructions = <ArrowTooltip label={FIRST_TIME_INSTRUCTIONS}
                                               visible={customSequenceList.length == 0} />;
        let editSequenceButton = [];
        if (predictionSettings.selectedSequence) {
            editSequenceButton = <button type="button" className="btn btn-default btn-sm"
                                        style={{marginTop: '5px', marginBottom: '10px', width: '100%'}}
                                        onClick={this.editExistingSequence} >Edit Sequence</button>;
        }
        return <div>
            <h4>Filter</h4>
            <ModelSelect selected={predictionSettings.model}
                         models={models}
                         onChange={this.onChangeModel} />
            <SelectItem title="Custom DNA:"
                        selected={predictionSettings.selectedSequence}
                        options={sequenceListOptions}
                        onChange={this.onChangeSequence}
                        labelControl={uploadInstructions} />
            {editSequenceButton}
            <BooleanInput checked={predictionSettings.maxPredictionSort}
                          label="Sort by max value"
                          onChange={this.onChangeMaxPredictionSort}/>
            <BooleanInput checked={predictionSettings.all} label="All values (heatmap)"
                          onChange={this.onChangeAll}/>
            <TFColorPickers showTwoPickers={showTwoColorPickers}
                            predictionColor={predictionColor}
                            setPredictionColor={setPredictionColor} />
            <UploadSequenceDialog isOpen={this.state.showCustomDialog}
                                  defaultSequenceName={this.state.defaultCustomSequenceName}
                                  sequenceData={this.state.sequenceData}
                                  onRequestClose={this.closeCustomDialog} />
        </div>
    }
}

export default PredictionFilterPanel;
