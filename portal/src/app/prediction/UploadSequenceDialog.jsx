import React from 'react';
import Popup from '../common/Popup.jsx'
import SingleFileUpload from '../common/SingleFileUpload.jsx'
import LoadingButton from '../common/LoadingButton.jsx'
import LargeTextarea from '../common/LargeTextarea.jsx'
import TextEdit from '../common/TextEdit.jsx'
import LoadSampleLink from '../common/LoadSampleLink.jsx'
import FileUpload from '../models/FileUpload.js';
import {CustomSequence, CustomSequenceList} from '../models/CustomSequence.js';
import {SEQUENCE_SAMPLE} from '../models/SampleData.js'

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
    titleErrorMessage: ''
};

class UploadSequenceDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = DEFAULT_STATE;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.sequenceData.id) {
            let customSequence = new CustomSequence();
            customSequence.fetch(nextProps.sequenceData.id, this.onSequenceInfo, this.onSequenceInfoError);
        }
        // reset state each time this dialog is shown
        if (nextProps.isOpen && !this.props.isOpen) {
            this.setState(DEFAULT_STATE);
        }
    }

    onSequenceInfo = (sequenceInfo) => {
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
            fileValue: undefined
        })
    };

    onChangeFile = (file, fileValue) => {
        this.setState({
            canUpload: true,
            textValue: '',
            file: file,
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
        return this.state.sequenceName || this.props.sequenceData.title || this.props.defaultSequenceName;
    };

    onUploadedSequence = (seqId, title) => {
        this.closeDialog(seqId, undefined, title);
    };

    onUploadedSequenceFailed = (errorMessage) => {
        this.closeDialog(undefined, errorMessage, '');
    };

    closeDialog = (seqId, errorMessage, title) => {
        if (seqId) {
            if (this.state.titleErrorMessage) {
                // user clicked upload really quick (before we could disable the upload button)
                return;
            }
        }
        this.props.onRequestClose(seqId, errorMessage, title);
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
    }

    loadSampleData = () => {
        this.onChangeTextValue(SEQUENCE_SAMPLE);
    };

    render() {
        let {isOpen, sequenceData} = this.props;
        let title = this.state.sequenceName;
        let isNew = true;
        let canUpload = this.state.canUpload;
        if (sequenceData.title) {
            title = sequenceData.title;
            isNew = false;
        }
        if (this.state.titleErrorMessage) {
            canUpload = false;
        }
        return <Popup isOpen={this.props.isOpen}
                      onRequestClose={this.onCloseNoSave}
                      title={TITLE}>
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
            <SingleFileUpload fileValue={this.state.fileValue}
                              loading={this.state.loading}
                              onChangeFile={this.onChangeFile}
                              disabled={this.state.loading}
            />
            <LoadingButton label="Upload"
                           loading={this.state.loading}
                           disabled={!canUpload}
                           onClick={this.onClickUpload}
            />
        </Popup>
    }
}

export default UploadSequenceDialog;