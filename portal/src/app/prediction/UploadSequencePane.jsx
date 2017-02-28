import React from 'react';
import Popup from '../common/Popup.jsx'
import SingleFileUpload from '../common/SingleFileUpload.jsx'
import LoadingButton from '../common/LoadingButton.jsx'
import LargeTextarea from '../common/LargeTextarea.jsx'
import TextEdit from '../common/TextEdit.jsx'
import LoadSampleLink from '../common/LoadSampleLink.jsx'
import ModelSelect from '../common/ModelSelect.jsx';
import UploadSequenceButtons from './UploadSequenceButtons.jsx';
import FileUpload from '../models/FileUpload.js';
import {CustomSequence, CustomSequenceList} from '../models/CustomSequence.js';
import {SEQUENCE_SAMPLE} from '../models/SampleData.js'
require('./UploadSequencePane.css');

const TITLE = "Custom DNA Sequence";
const INSTRUCTIONS = "Enter Sequence/FASTA data or choose a file in that format. (Max file size 20MB)";
const PURGE_WARNING = "DNA Lists will be purged after 48 hours.";
const TEXTAREA_PLACEHOLDER_TEXT = "CGATCGATG";
const DEFAULT_STATE = {
    loading: false,
    canUpload: false,
    file: undefined,
    fileValue: undefined,
    textValue: '',
    sequenceName: '',
    titleErrorMessage: '',
    uploadErrorMessage: '',
    isNew: true,
    model: '',
    previousSequenceId: ''
};

export default class UploadSequencePane extends React.Component {
    constructor(props) {
        super(props);
        this.state = DEFAULT_STATE;
    }

    componentDidMount() {
        let {sequenceData, predictionSettings, createNewSequence} = this.props;
        let previousSequenceId = '';
        if (!createNewSequence) {
            let customSequence = new CustomSequence();
            previousSequenceId = predictionSettings.selectedSequence;
            if (previousSequenceId) {
                customSequence.fetch(previousSequenceId, this.onSequenceInfo, this.onSequenceInfoError);
            }
        }
        this.setState({
            isNew: createNewSequence,
            previousSequenceId: previousSequenceId,
        });
    }

    onSequenceInfo = (sequenceInfo) => {
        let customListObj = new CustomSequenceList();
        let existingSequenceTitle = customListObj.lookup(sequenceInfo.id).title;
        console.log("HEY" + existingSequenceTitle);
        this.setState({
            sequenceName: existingSequenceTitle
        });
        this.onChangeTextValue(atob(sequenceInfo.data));
    };

    onSequenceInfoError = (err) => {
        alert(err.message);
    };

    onChangeTextValue = (value) => {
        this.setState({
            canUpload: true,
            textValue: value,
            file: undefined,
            uploadErrorMessage: '',
            fileValue: undefined
        })
    };

    onChangeFile = (file, fileValue) => {
        this.setState({
            canUpload: true,
            textValue: '',
            file: file,
            uploadErrorMessage: '',
            fileValue: fileValue
        })
    };

    onClickUpload = () => {
        this.setState({
            loading: true
        });
        if (this.state.file) {
            let fileUpload = new FileUpload(this.state.file);
            fileUpload.fetchAllFile(this.uploadSequence);
        } else {
            this.uploadSequence(this.state.textValue);
        }
    };

    uploadSequence = (data) => {
        if (data) {
            this.setState({
                loading: false
            });
            let customSequence = new CustomSequence();
            customSequence.upload(data, this.determineTitle(),
                this.onUploadedSequence, this.onUploadedSequenceFailed);
        }
    };

    determineTitle = () => {
        return this.state.sequenceName || this.props.defaultSequenceName;
    };

    onUploadedSequence = (seqId, title) => {
        this.closeDialog(seqId, undefined, title);
    };

    onUploadedSequenceFailed = (errorMessage) => {
        this.setState({
            uploadErrorMessage: errorMessage
        });
    };

    closeDialog = (seqId, errorMessage, title) => {
        if (seqId) {
            if (this.state.titleErrorMessage) {
                // user clicked upload really quick (before we could disable the upload button)
                return;
            }
        }
        this.props.onRequestClose(seqId, errorMessage, title, this.state.previousSequenceId);
    };

    onChangeModel = (e) => {
        let value = e.target.value;
        this.props.setPredictionSettings({model: value});
    };

    onClickViewPredictions = () => {
        this.props.setShowInputPane(false);
    };

    onCloseNoSave = () => {
        this.closeDialog(undefined, undefined, '');
    };

    setSequenceName = (evt) => {
        let sequenceName = evt.target.value;
        let titleErrorMessage = undefined;
        if (this.isDuplicateTitle(sequenceName)) {
            titleErrorMessage = "This title is already taken.";
        }
        this.setState({
            sequenceName: sequenceName,
            titleErrorMessage: titleErrorMessage
        });
    };

    isDuplicateTitle = (sequenceName) => {
        let customListObj = new CustomSequenceList();
        return customListObj.isTitleDuplicate(this.uploadSequence.id, sequenceName);
    };

    loadSampleData = () => {
        this.onChangeTextValue(SEQUENCE_SAMPLE);
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

    render() {
        let {sequenceData, predictionSettings} = this.props;
        let {isNew} = this.state;
        let noCustomSequences = new CustomSequenceList().isEmpty();
        console.log(sequenceData);
        let models = this.getModels();

        let title = this.state.sequenceName;
        let canUpload = this.state.canUpload;
        if (sequenceData.title) {
            title = sequenceData.title;
        }
        if (this.state.titleErrorMessage) {
            canUpload = false;
        }
        return <div className="UploadSequencePane_container" >
            <p>{INSTRUCTIONS}</p>
            <p>{PURGE_WARNING}</p>
            <div className="largeLeftInlineBlock">
                <TextEdit title="Title: "
                          value={title}
                          placeholder={this.props.defaultSequenceName}
                          onChange={this.setSequenceName}
                          size="30"
                          maxlength="50"
                          errorMessage={this.state.titleErrorMessage}
                    />
            </div>
            <div className="smallRightInlineBlock">
                <LoadSampleLink onClick={this.loadSampleData} hidden={!isNew}/>
            </div>

            <LargeTextarea placeholder={TEXTAREA_PLACEHOLDER_TEXT}
                           value={this.state.textValue}
                           onChange={this.onChangeTextValue}
                           disabled={this.state.loading}
            />
            <div>
                <SingleFileUpload fileValue={this.state.fileValue}
                                  loading={this.state.loading}
                                  onChangeFile={this.onChangeFile}
                                  disabled={this.state.loading}
                />
                <span className="UploadSequencePane_uploadErrorMessage">{this.state.uploadErrorMessage}</span>
            </div>
            <div className="UploadSequencePane_model_select_div">
                <ModelSelect selected={predictionSettings.model}
                             models={models}
                             onChange={this.onChangeModel} />
            </div>
            <div className="UploadSequencePane_generate_pred_button_div">
                <UploadSequenceButtons
                    loading={this.state.loading}
                    generatePredictionsDisabled={!canUpload}
                    clickGeneratePredictions={this.onClickUpload}
                    viewPredictionsDisabled={noCustomSequences}
                    clickViewPredictions={this.onClickViewPredictions}
                />
            </div>
        </div>
    }
}
