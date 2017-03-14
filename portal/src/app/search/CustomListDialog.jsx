import React from 'react';
import Modal from 'react-modal';
import Loader from 'react-loader';
import { CustomListData } from '../models/CustomList.js';
import UploadContent from '../models/UploadContent.js';
import CustomFile from '../models/CustomFile.js';
import GeneSearchType from './GeneSearchType.jsx'
import LoadSampleLink from '../common/LoadSampleLink.jsx'
import SingleFileUpload from '../common/SingleFileUpload.jsx'
import ErrorMessage from '../common/ErrorMessage.jsx';
import {GENE_LIST_SAMPLE, RANGE_LIST_SAMPLE} from '../models/SampleData.js'
require('./CustomListDialog.css');


const customStyles = {
  content : {
    minHeight: '450px',
  },
    overlay : {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 100,
    }
};

class CustomListDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            textValue: '',
            loading: false,
            fileValue: '',
            file: undefined,
            geneList: 'All',
            geneSearchType: 'gene_name',
            uploadErrorMessage: ''
        };
    }

    setGeneSearchType = (searchType) => {
        this.setState({
            geneSearchType: searchType
        })
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.isOpen) {
            let textValue = this.state.textValue;
            let geneList = this.state.geneList;
            if (this.state.type !== nextProps.type) {
                textValue = '';
                geneList = 'All';
            }
            this.setState({
                textValue: textValue,
                file: undefined,
                fileValue: '',
                geneList: geneList,
                loading: false,
                type: nextProps.type,
                uploadErrorMessage: ''
            });
        }
    }

    changeUploadFile = (file, fileValue) => {
        if (file) {
            this.setState({
                textValue: "",
                file: file,
                fileValue: fileValue,
                loading: false,
            });
        } else {
            customListDialog.setState({
                textValue: '',
                fileValue: '',
                file: file,
            });
        }
    };

    changeText = (evt) => {
        this.setText(evt.target.value);
    };

    setText = (value) => {
        this.setState({
            textValue: value,
            loading: false,
            file: undefined,
            fileValue: '',
            uploadErrorMessage: ''
        });
    };

    onChangeGeneList = (evt) => {
        let geneList = evt.target.value;
        this.setState({
            geneList: geneList
        });
    };

    onClickSearch = () => {
        let uploadContent = new UploadContent(this.state.file, this.state.textValue);
        if (uploadContent.isTooBig()) {
            this.onUploadError(uploadContent.getTooBigErrorMessage());
        } else {
            this.setState({
                loading: true
            });
            uploadContent.fetchData(this.closeReturningResult);
        }
    };

    onUploadError = (message) => {
        this.setState({
            uploadErrorMessage: message
        });
    };

    exitDialog = () => {
        this.props.onRequestClose('', this.state.geneList, this.state.geneSearchType);
    };

    closeReturningResult = (textValue) => {
        this.setState({
            uploadErrorMessage: ''
        })
        let customListDialog = this;
        let customListData = new CustomListData(customListDialog.props.type);
        let customFile = new CustomFile(customListData.isGeneList(), textValue);
        customFile.uploadFile(function(key) {
            customListDialog.props.onRequestClose(key,
                customListDialog.state.geneList,
                customListDialog.state.geneSearchType);
        }, function(error){
            customListDialog.setState({
                loading: false,
            })
            this.onUploadError(error);
        })
    };

    loadSampleData = () => {
        let customListData = new CustomListData(this.props.type);
        if (customListData.isGeneList()) {
            this.setText(GENE_LIST_SAMPLE);
        } else {
            this.setText(RANGE_LIST_SAMPLE);
        }
    };

    render() {
        let customListData = new CustomListData(this.props.type);
        let instructions = [];
        let sampleData = customListData.sampleData;
        let purgeWarning = <span className="CustomListDialog__delete_warning">Uploaded data will be deleted after 48 hours.</span>;
        if (customListData.isGeneList()) {
            instructions = <div>
                    <p >Enter a list of gene symbols/ID or choose a file in that format. (Max file size 20MB)</p>
                    <div className="largeLeftInlineBlock" >
                        {purgeWarning}
                    </div>
                    <div className="smallRightInlineBlock">
                        <LoadSampleLink onClick={this.loadSampleData} />
                    </div>
                </div>;
        } else {
            instructions = <div>
                    <p>Enter a list of tab or space separated values or choose a file in that format. (Max size 20MB)</p>
                    {purgeWarning}
                    <div className="largeLeftInlineBlock" >
                        <span>Format is: "CHROMOSOME START END".</span>
                    </div>
                    <div className="smallRightInlineBlock">
                        <LoadSampleLink onClick={this.loadSampleData} />
                    </div>
                </div>;
        }
        let disableSearch = !this.state.textValue && !this.state.file;
        let hasText = this.state.textValue.length > 0;
        let geneListDropdown = [];
        if (customListData.isGeneList()) {
            let options = [<option key="All">All</option>]
            for (let name of this.props.geneListNames) {
                options.push(<option key={name}>{name}</option>)
            }
            geneListDropdown = <div>
                                    <GeneSearchType
                                        geneSearchType={this.state.geneSearchType}
                                        setGeneSearchType={this.setGeneSearchType} />
                                    <label>Search Gene List:</label>
                                    <select className="form-control CustomListDialog_small_lower_margin"
                                            value={this.state.geneList}
                                            onChange={this.onChangeGeneList}>
                                        {options}
                                    </select>
                                </div>
        }
        return <Modal className="Modal__Bootstrap modal-dialog modal-lg"
                      isOpen={this.props.isOpen}
                      onRequestClose={this.exitDialog}
                      style={customStyles} >
                    <div>
                        <div className="modal-header">
                          <button type="button" className="close" onClick={this.exitDialog}>
                            <span aria-hidden="true">&times;</span>
                            <span className="sr-only">Close</span>
                          </button>
                          <h4 className="modal-title">{customListData.type}</h4>
                        </div>
                            <div className="CustomListDialog_content" >
                                {instructions}

                                <textarea className="CustomListDialog_textarea"
                                          placeholder={sampleData}
                                          value={this.state.textValue}
                                          onChange={this.changeText}
                                          disabled={this.state.loading}
                                ></textarea>
                                <div>
                                    <SingleFileUpload fileValue={this.state.fileValue}
                                        loading={this.state.loading}
                                        onChangeFile={this.changeUploadFile}
                                        disabled={this.state.loading}
                                    />
                                    <ErrorMessage message={this.state.uploadErrorMessage} />
                                </div>
                                {geneListDropdown}
                                <Loader loaded={!this.state.loading} >
                                    <button className="btn btn-default"
                                            type="button"
                                            disabled={disableSearch}
                                            onClick={this.onClickSearch}>Search</button>
                                </Loader>

                            </div>


                    </div>
            </Modal>
    }
}



export default CustomListDialog;