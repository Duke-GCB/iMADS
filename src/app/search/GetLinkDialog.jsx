import React from 'react';
import Modal from 'react-modal';
import {isCustomList} from '../store/CustomList.js'

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
        }
        this.changeIncludeCustomList = this.changeIncludeCustomList.bind(this);
    }

    changeIncludeCustomList(evt) {
        this.setState({
            includeCustomList: evt.target.checked,
        });
    }

    render() {
        var customList = isCustomList(this.props.searchSettings.geneList);
        var url = window.location.href;
        if (!this.state.includeCustomList) {
            url = url.replace(/&customListData=[a-f\d-]+/, '');
        }
        let searchSettings = this.props.searchSettings;
        var customListCheckbox = [];
        var message = '';
        if (customList) {
            customListCheckbox = <label>
                    <input type="checkbox"
                           checked={this.state.includeCustomList}
                           onChange={this.changeIncludeCustomList}
                           style={{marginRight: '10px', marginTop: '10px', marginLeft: '20px'}}/>
                    Include Custom List
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


                <div style={{marginLeft: '20px', marginRight: '20px', marginTop: '20px'}}>
                    <textarea style={{width:'100%', height: "50%"}} value={url} readOnly>
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