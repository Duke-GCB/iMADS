import React from 'react';
import Modal from 'react-modal';
import { CustomListData } from './store/CustomList.js';

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
        }
        this.changeUploadFile = this.changeUploadFile.bind(this);
        this.changeText = this.changeText.bind(this);
        this.onClickSearch = this.onClickSearch.bind(this);
        this.setText = this.setText.bind(this);

    }
    changeUploadFile(evt) {
        var customListDialog = this;
        var file = evt.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var text = reader.result;
                customListDialog.setText(text);
            }
            reader.readAsText(file);
        } else {
            customListDialog.setState({
                text: this.state.text,
            });
        }

    }
    changeText(evt) {
        this.setText(evt.target.value);
    }
    setText(value) {
        this.setState({
            text: value,
        });
    }
    onClickSearch() {
        var customListData = new CustomListData(this.props.type);
        var result = customListData.encode(this.state.text);
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
                                <textarea style={{width: '100%', height:'50%', fontFamily: 'Monaco, monospace'}} placeholder={sampleData}
                                          value={this.state.text}
                                          onChange={this.changeText}
                                ></textarea>

                                <input style={{marginTop: '10px', marginBottom:'10px'}} type="file" name="fileField"
                                       onChange={this.changeUploadFile}
                                />

                                <button className="btn btn-default"
                                        type="button"
                                        disabled={disableSearch}
                                        onClick={this.onClickSearch}>Search</button>
                            </div>


                    </div>
            </Modal>
    }
}



export default CustomListDialog;