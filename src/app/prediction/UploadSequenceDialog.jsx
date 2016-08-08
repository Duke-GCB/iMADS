import React from 'react';
import Popup from '../common/Popup.jsx'
import SingleFileUpload from '../common/SingleFileUpload.jsx'
import LoadingButton from '../common/LoadingButton.jsx'
import LargeTextarea from '../common/LargeTextarea.jsx'
import FileUpload from '../store/FileUpload.js';
import {CustomSequence} from '../store/CustomSequence.js';

const TITLE = "Custom DNA Sequence";
const INSTRUCTIONS = "Enter Sequence/FASTA data or choose a file in that format. (Max file size 20MB)";
const PURGE_WARNING = "DNA Lists will be purged after 48 hours.";
const TEXTAREA_PLACEHOLDER_TEXT = "CGATCGATG"

const DEFAULT_STATE = {
    loading: false,
    canUpload: false,
    file: undefined,
    fileValue: undefined,
    textValue: '',
};

class UploadSequenceDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = DEFAULT_STATE;
        this.onChangeFile = this.onChangeFile.bind(this);
        this.onClickUpload = this.onClickUpload.bind(this);
        this.onChangeTextValue = this.onChangeTextValue.bind(this);
        this.onCloseNoSave = this.onCloseNoSave.bind(this);
        this.uploadSequence = this.uploadSequence.bind(this);
        this.onUploadedSequence = this.onUploadedSequence.bind(this);
        this.onUploadedSequenceFailed = this.onUploadedSequenceFailed.bind(this);
    }

    onChangeTextValue(value) {
        this.setState({
            canUpload: true,
            textValue: value,
            file: undefined,
            fileValue: undefined
        })
    }

    onChangeFile(file, fileValue) {
        this.setState({
            canUpload: true,
            textValue: '',
            file: file,
            fileValue: fileValue
        })
    }

    onClickUpload() {
        this.setState({
            loading: true
        });
        if (this.state.file) {
            let fileUpload = new FileUpload(this.state.file);
            fileUpload.fetchAllFile(this.uploadSequence);
        } else {
            this.uploadSequence(this.state.textValue);
        }
    }

    uploadSequence(data) {
        if (data) {
            this.setState({
                loading: false
            });
            let customSequence = new CustomSequence(data);
            customSequence.upload(this.onUploadedSequence, this.onUploadedSequenceFailed)
        }
    }

    onUploadedSequence(seqId) {
        let {onRequestClose} = this.props;
        this.resetState();
        onRequestClose(seqId, undefined);
    }

    onUploadedSequenceFailed(errorMessage) {
        onRequestClose(undefined, errorMessage);
    }

    resetState() {
        this.setState(DEFAULT_STATE);
    }

    onCloseNoSave() {
        let {onRequestClose} = this.props;
        this.resetState();
        onRequestClose(undefined, undefined);
    }

    render() {
        let {isOpen} = this.props;

        return <Popup isOpen={this.props.isOpen}
                      onRequestClose={this.onCloseNoSave}
                      title={TITLE}>
            <p>{INSTRUCTIONS}</p>
            <p>{PURGE_WARNING}</p>
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
                           disabled={!this.state.canUpload}
                           onClick={this.onClickUpload}
            />
        </Popup>
    }
}

export default UploadSequenceDialog;