import React from 'react';
require('./DownloadButton.css');
import DownloadData from '../common/DownloadData.jsx';

class DownloadListItem extends React.Component {
    render() {
        let {key, url, label} = this.props;
        return <li><a key={key} href={url} download>{label}</a></li>;
    }
}

class DownloadButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dialogVisible: false
        }
    }
    openDialog = () => {
      this.setState({
          dialogVisible: true
      })
    };
    closeDialog = () => {
      this.setState({
          dialogVisible: false
      })
    };
    render() {
        let {tabDelimitedURL, csvDelimitedURL, rawDataURL, dataStore, searchSettings} = this.props;
        let {dialogVisible} = this.state;
        let downloadItems = [];
        if (rawDataURL) {
            downloadItems.push(<DownloadListItem key="rawData" url={rawDataURL} label="Raw Data" />);
        }
        downloadItems.push(<DownloadListItem key="tabDelim" url={tabDelimitedURL} label="Tab Delimited" />);
        downloadItems.push(<DownloadListItem key="csvDelim" url={csvDelimitedURL} label="CSV Format" />);
        return <div className="DownloadButton_div" >
                        <button className="btn btn-default DownloadButton_button" type="button"
                                id="dropdownMenu1" onClick={this.openDialog}
                        >Download All Data</button>
                        <DownloadData searchSettings={searchSettings}
                                      dataStore={dataStore}
                                      isVisible={dialogVisible}
                                      onClose={this.closeDialog} />
                    </div>
    }
}



export default DownloadButton;
