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
    titleErrorMessage: '',
    uploadErrorMessage: '',
};

/**
 * UploadSequencePane - shows panel for uploading a custom DNA sequence/picking a model and run prediction generation.
 * Properties:
 *   genomeData - models available for different genome versions
 *
 *   uploadSequenceData - object containing data that persists when this component is unmounted
 *     loadSequenceId - sequence id we should fetch when this component mounts
 *     sequenceName - name of the sequence we are going to upload
 *     model - name of the model we selected for predictions
 *     showLoadSampleLink - boolean should we show the LoadSampleLink button
 *
 *   setUploadSequenceData(uploadSequenceData) - asks parent to change uploadSequenceData
 *
 *   defaultSequenceName - sequence name to use if the user doesn't pick one (shows as placeholder)
 *   generatePredictionsForSequence(seqId, model, title, previousSequenceId) - asks parent to generate predictions
 *   viewExistingPredictions() - asks parent to show existing predictions screen
 *
 */

export default class UploadSequencePane extends React.Component {
    constructor(props) {
        super(props);
        this.state = DEFAULT_STATE;
    }

    componentDidMount() {
        let {uploadSequenceData} = this.props;
        if (uploadSequenceData.loadSequenceId) {
            let customSequence = new CustomSequence();
            customSequence.fetch(uploadSequenceData.loadSequenceId, this.onSequenceInfo, this.onSequenceInfoError);
        }
    }

    onSequenceInfo = (sequenceInfo) => {
        this.onChangeTextValue(atob(sequenceInfo.data));
    };

    setSequenceName = (name) => {
        let {uploadSequenceData} = this.props;
        uploadSequenceData.sequenceName = name;
        this.props.setUploadSequenceData(uploadSequenceData);
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
         let {uploadSequenceData, defaultSequenceName} = this.props;
        return uploadSequenceData.sequenceName || defaultSequenceName;
    };

    onUploadedSequence = (seqId, title) => {
        let {uploadSequenceData, generatePredictionsForSequence} = this.props;
        if (this.state.titleErrorMessage) {
            // user clicked upload really quick (before we could disable the upload button)
            return;
        }
        generatePredictionsForSequence(seqId,
            uploadSequenceData.model,
            title,
            uploadSequenceData.loadSequenceId);
    };

    onUploadedSequenceFailed = (errorMessage) => {
        this.setState({
            uploadErrorMessage: errorMessage
        });
    };

    onChangeModel = (e) => {
        let {uploadSequenceData} = this.props;
        uploadSequenceData.model = e.target.value;
        this.props.setUploadSequenceData(uploadSequenceData);
    };

    onClickViewPredictions = () => {
        let {viewExistingPredictions} = this.props;
        viewExistingPredictions();
    };

    onChangeSequenceName = (evt) => {
        let sequenceName = evt.target.value;
        let titleErrorMessage = undefined;
        if (this.isDuplicateTitle(sequenceName)) {
            titleErrorMessage = "This title is already taken.";
        }
        this.setSequenceName(sequenceName);
        this.setState({
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
        let {uploadSequenceData} = this.props;
        let noCustomSequences = new CustomSequenceList().isEmpty();
        let models = this.getModels();
        let title = uploadSequenceData.sequenceName;
        let canUpload = this.state.canUpload;
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
                          onChange={this.onChangeSequenceName}
                          size="30"
                          maxlength="50"
                          errorMessage={this.state.titleErrorMessage}
                    />
            </div>
            <div className="smallRightInlineBlock">
                <LoadSampleLink onClick={this.loadSampleData} hidden={!uploadSequenceData.showLoadSampleLink}/>
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
                <ModelSelect selected={uploadSequenceData.model}
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
