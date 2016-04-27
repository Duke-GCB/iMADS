import React from 'react';
import Modal from 'react-modal';
import Loader from 'react-loader';
import { CustomListData } from '../store/CustomList.js';
import FileUpload from '../store/FileUpload.js';


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
        }
        this.changeUploadFile = this.changeUploadFile.bind(this);
        this.changeText = this.changeText.bind(this);
        this.onClickSearch = this.onClickSearch.bind(this);
        this.closeReturningResult = this.closeReturningResult.bind(this);
        this.setText = this.setText.bind(this);
        this.fileUpload = undefined;

    }
    changeUploadFile(evt) {
        var customListDialog = this;
        var file = evt.target.files[0];
        if (file) {
            this.fileUpload = new FileUpload(file);
            this.fileUpload.fetchPreviewLines(customListDialog.setText);
            customListDialog.setState({
                loading: true,
            })
        } else {
            this.fileUpload = undefined;
            customListDialog.setState({
                text: '',
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
        });
    }
    onClickSearch() {
        if (this.fileUpload) {
            this.setState({
                loading: true,
            })
            this.fileUpload.fetchAllFile(this.closeReturningResult);
        } else {
            this.closeReturningResult(this.state.text);
        }
    }

    closeReturningResult(text) {
        var customListData = new CustomListData(this.props.type);
        var result = customListData.encode(text);
        this.props.onRequestClose(result);
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
        var disableSearch = this.state.text.length == 0;
        return <Modal className="Modal__Bootstrap modal-dialog modal-lg"
                      isOpen={this.props.isOpen}
                      onRequestClose={this.props.onRequestClose}
                      style={customStyles} >
                    <div>
                        <div className="modal-header">
                          <button type="button" className="close" onClick={this.props.onRequestClose}>
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

                                <input style={{marginTop: '10px', marginBottom:'10px'}} type="file" name="fileField"
                                       onChange={this.changeUploadFile}
                                       disabled={this.state.loading}
                                />
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