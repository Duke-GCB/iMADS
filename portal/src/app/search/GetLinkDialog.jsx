import React from 'react';
import Modal from 'react-modal';
import {isCustomList} from '../models/CustomList.js';
require('./GetLinkDialog.css');

const customStyles = {
    content: {
        height: '40%',
        minHeight: '300px',
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 100,

    }
};

class GetLinkDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            includeCustomList: true,
        };
    }

    changeIncludeCustomList = (evt) => {
        this.setState({
            includeCustomList: evt.target.checked,
        });
    };

    render() {
        let customList = isCustomList(this.props.searchSettings.geneList);
        let url = window.location.href;
        if (!this.state.includeCustomList) {
            url = url.replace(/&customListData=[a-f\d-]+/, '');
        }
        let searchSettings = this.props.searchSettings;
        let customListCheckbox = [];
        let message = '';
        if (customList) {
            customListCheckbox = <label className="GetLinkDialog_include_custom_list">
                    <input type="checkbox"
                           checked={this.state.includeCustomList}
                           onChange={this.changeIncludeCustomList}
                            />
                    &nbsp;Include Custom List
                </label>;
            message = 'Note: Custom lists are deleted 48 hours after uploading.';
        }
        return <Modal className="Modal__Bootstrap modal-dialog modal-md"
                      isOpen={this.props.isOpen}
                      onRequestClose={this.props.closeDialog}
                      style={customStyles}>
            <div>
                <div className="modal-header">
                    <button type="button" className="close" onClick={this.props.closeDialog}>
                        <span aria-hidden="true">&times;</span>
                        <span className="sr-only">Close</span>
                    </button>
                    <h4 className="modal-title">Share Link</h4>
                </div>


                <div className="GetLinkDialog_textarea_container" >
                    <textarea className="GetLinkDialog_textarea"   value={url} readOnly>
                    </textarea>
                </div>
                {customListCheckbox}

                <p className="centerChildrenHorizontally">
                    {message}
                </p>

            </div>
        </Modal>;


    }
}

export default GetLinkDialog;