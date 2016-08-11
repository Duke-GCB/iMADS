import React from 'react';
import Popup from '../common/Popup.jsx'
import SingleFileUpload from '../common/SingleFileUpload.jsx'
import LoadingButton from '../common/LoadingButton.jsx'
import LargeTextarea from '../common/LargeTextarea.jsx'
import TextEdit from '../common/TextEdit.jsx'
import LoadSampleLink from '../common/LoadSampleLink.jsx'
import FileUpload from '../store/FileUpload.js';
import {CustomSequence} from '../store/CustomSequence.js';


const TITLE = "Custom DNA Sequence";
const INSTRUCTIONS = "Enter Sequence/FASTA data or choose a file in that format. (Max file size 20MB)";
const PURGE_WARNING = "DNA Lists will be purged after 48 hours.";
const TEXTAREA_PLACEHOLDER_TEXT = "CGATCGATG";
const LOAD_SAMPLE_DATA = "Load Sample Data";


const DEFAULT_STATE = {
    loading: false,
    canUpload: false,
    file: undefined,
    fileValue: undefined,
    textValue: '',
    sequenceName: '',
};

const SAMPLE_DATA = `>sequence1
TCCTGGGATCCCCACAATATACGCTGGGGCACTCGGAAGAGTCAAATCCGGTTCGCGGGA
AAATACTCCGTATCCCAGACTTATGACTGCCTATGGCAAC

>sequence2
GTGCCTCGATTGTCGCTGAGATGAACTATCCTTGTCCAATATTGATTTCACCCGCAGTTT
CCGAACACACCTTATACTCTGCGTGGCAGCGACTATCAGG`;

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

    componentWillReceiveProps(nextProps) {
        console.log(nextProps);
        if (nextProps.sequenceData.id) {
            let customSequence = new CustomSequence();
            customSequence.fetch(nextProps.sequenceData.id, this.onSequenceInfo, this.onSequenceInfoError);
        }
        // reset state each time this dialog is shown
        if (nextProps.isOpen && !this.props.isOpen) {
            this.setState(DEFAULT_STATE);
        }
    }

    componentWillUnmount() {
        console.log("UNMOUNT!");
    }

    onSequenceInfo = (sequenceInfo) => {
        this.onChangeTextValue(atob(sequenceInfo.data));
    };

    onSequenceInfoError = (err) => {
        alert(err.message);
    };

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
            let customSequence = new CustomSequence();
            customSequence.upload(data, this.determineTitle(),
                this.onUploadedSequence, this.onUploadedSequenceFailed);
        }
    }

    determineTitle = () => {
        return this.state.sequenceName || this.props.sequenceData.title || this.props.defaultSequenceName;
    }

    onUploadedSequence(seqId, title) {
        this.closeDialog(seqId, undefined, title);
    }

    onUploadedSequenceFailed(errorMessage) {
        this.closeDialog(undefined, errorMessage, '');
    }

    closeDialog = (seqId, errorMessage, title) => {
        this.props.onRequestClose(seqId, errorMessage, title);
    };

    onCloseNoSave() {
        this.closeDialog(undefined, undefined, '');
    }

    setSequenceName = (evt) => {
        this.setState({
            sequenceName: evt.target.value
        });
    }

    loadSampleData = () => {
        this.onChangeTextValue(SAMPLE_DATA);
    };

    render() {
        let {isOpen, sequenceData} = this.props;
        let title = this.state.sequenceName;
        let isNew = true;
        if (sequenceData.title) {
            title = sequenceData.title;
            isNew = false;
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
                           disabled={!this.state.canUpload}
                           onClick={this.onClickUpload}
            />
        </Popup>
    }
}

export default UploadSequenceDialog;