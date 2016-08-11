import React from 'react';
import Modal from 'react-modal';
import Loader from 'react-loader';
import { CustomListData } from '../store/CustomList.js';
import FileUpload from '../store/FileUpload.js';
import CustomFile from '../store/CustomFile.js';
import GeneSearchType from './GeneSearchType.jsx'
import LoadSampleLink from '../common/LoadSampleLink.jsx'

const GENE_LIST_SAMPLE = `SLC3A2
CCND2
MYL9
UBL3
GJA1
IFI27
FBN1
ANPEP`;

const RANGE_LIST_SAMPLE = `chr2    133021766       133035246
chr15   41951996        41954481
chr7    915704  916415
chr19   41902920        41904063
chr4    57301199        57302843
chr17   38255037        38257434`;

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
            text: '',
            loading: false,
            fileValue: '',
            file: undefined,
            geneList: 'All',
            geneSearchType: 'gene_name',
        }
        this.changeUploadFile = this.changeUploadFile.bind(this);
        this.changeText = this.changeText.bind(this);
        this.onChangeGeneList = this.onChangeGeneList.bind(this);
        this.onClickSearch = this.onClickSearch.bind(this);
        this.closeReturningResult = this.closeReturningResult.bind(this);
        this.setText = this.setText.bind(this);
        this.exitDialog = this.exitDialog.bind(this);
        this.setGeneSearchType = this.setGeneSearchType.bind(this);
    }

    setGeneSearchType(searchType) {
        this.setState({
            geneSearchType: searchType
        })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isOpen) {
            let text = this.state.text;
            let geneList = this.state.geneList;
            if (this.state.type !== nextProps.type) {
                text = '';
                geneList = 'All';
            }
            this.setState({
                text: text,
                file: undefined,
                fileValue: '',
                geneList: geneList,
                loading: false,
                type: nextProps.type,
            });
        }
    }

    changeUploadFile(evt) {
        let customListDialog = this;
        let file = evt.target.files[0];
        if (file) {
            this.setState({
                text: "",
                file: file,
                fileValue: evt.target.value,
                loading: false,
            });
        } else {
            customListDialog.setState({
                text: '',
                fileValue: '',
                file: file,
            });
        }
    }



    changeText(evt) {
        this.setText(evt.target.value);
    }
    setText(value) {
        this.setState({
            text: value,
            loading: false,
            file: undefined,
            fileValue: '',
        });
    }
    onChangeGeneList(evt) {
        let geneList = evt.target.value;
        this.setState({
            geneList: geneList
        });
    }
    onClickSearch() {
        if (this.state.file) {
            this.setState({
                loading: true,
            })
            let fileUpload = new FileUpload(this.state.file);
            fileUpload.fetchAllFile(this.closeReturningResult);
        } else {
            this.closeReturningResult(this.state.text);
        }
    }

    exitDialog() {
        this.props.onRequestClose('', this.state.geneList, this.state.geneSearchType);
    }

    closeReturningResult(text) {
        let customListDialog = this;
        let customListData = new CustomListData(customListDialog.props.type);
        let customFile = new CustomFile(customListData.isGeneList(), text);
        customFile.uploadFile(function(key) {
            customListDialog.props.onRequestClose(key,
                customListDialog.state.geneList,
                customListDialog.state.geneSearchType);
        }, function(error){
            customListDialog.setState({
                loading: false,
            })
            alert(error);
        })
    }

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
        /*
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
         */
        let disableSearch = !this.state.text && !this.state.file;
        let hasText = this.state.text.length > 0;
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
                                    <select className="form-control small_lower_margin"
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
                            <div style={{margin: '20px'}}>
                                {instructions}

                                <textarea className="CustomListDialog_textarea"
                                          placeholder={sampleData}
                                          value={this.state.text}
                                          onChange={this.changeText}
                                          disabled={this.state.loading}
                                ></textarea>
                                <input
                                    style={{marginTop: '10px', marginBottom:'10px'}} type="file" name="fileField"
                                       onChange={this.changeUploadFile}
                                       disabled={this.state.loading}
                                       value={this.state.fileValue}
                                />
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