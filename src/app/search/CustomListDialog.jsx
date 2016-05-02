import React from 'react';
import Modal from 'react-modal';
import Loader from 'react-loader';
import { CustomListData } from '../store/CustomList.js';
import FileUpload from '../store/FileUpload.js';
import CustomFile from '../store/CustomFile.js';

const customStyles = {
  content : {

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
            file_value: '',
            file: undefined,
            gene_list: 'All',
        }
        this.changeUploadFile = this.changeUploadFile.bind(this);
        this.changeText = this.changeText.bind(this);
        this.onChangeGeneList = this.onChangeGeneList.bind(this);
        this.onClickSearch = this.onClickSearch.bind(this);
        this.closeReturningResult = this.closeReturningResult.bind(this);
        this.setText = this.setText.bind(this);
        this.exitDialog = this.exitDialog.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isOpen && !this.state.props) {
            this.setState({
                text: '',
                file: undefined,
                file_value: '',
                gene_list: 'All',
                loading: false,
            });
        }
    }

    changeUploadFile(evt) {
        var customListDialog = this;
        var file = evt.target.files[0];
        if (file) {
            this.setState({
                text: "",
                file: file,
                file_value: evt.target.value,
                loading: false,
            });
        } else {
            customListDialog.setState({
                text: '',
                file_value: '',
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
            file_value: '',
        });
    }
    onChangeGeneList(evt) {
        let gene_list = evt.target.value;
        this.setState({
            gene_list: gene_list
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
        this.props.onRequestClose('', this.state.gene_list);
    }

    closeReturningResult(text) {
        let customListDialog = this;
        let customListData = new CustomListData(customListDialog.props.type);
        let customFile = new CustomFile(customListData.isGeneList(), text);
        customFile.uploadFile(function(key) {
            customListDialog.props.onRequestClose(key, customListDialog.state.gene_list);
        }, function(error){
            customListDialog.setState({
                loading: false,
            })
            alert(error);
        })
    }

    render() {
        var customListData = new CustomListData(this.props.type);
        var instructions = [];
        var sampleData = customListData.sampleData;
        if (customListData.isGeneList()) {
            instructions = <div>
                    <p>Enter a list of gene symbols/ID or choose a file in that format.</p>
                </div>;
        } else {
            instructions = <div>
                    <p>Enter a list of tab separated values or choose a file in that format.</p>
                    <p>Format is: "CHROMOSOME START END".</p>
                </div>;
        }
        var disableSearch = !this.state.text && !this.state.file;
        var gene_list_options = [
            <option>All Gene Lists</option>
        ];
        var hasText = this.state.text.length > 0;
        var geneListDropdown = [];
        if (customListData.isGeneList()) {
            var options = [<option key="All">All</option>]
            for (let name of this.props.gene_list_names) {
                options.push(<option key={name}>{name}</option>)
            }
            geneListDropdown = <div>
                                    <label>Search Gene List:</label>
                                    <select className="form-control small_lower_margin"
                                            value={this.state.gene_list}
                                            onChange={this.onChangeGeneList}>
                                        {options}
                                    </select>
                                </div>
        }
        var thing = <h2>HEY</h2>;
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
                                       value={this.state.file_value}
                                />
                                {geneListDropdown}
                                <Loader loaded={!this.state.loading} component={thing} >
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