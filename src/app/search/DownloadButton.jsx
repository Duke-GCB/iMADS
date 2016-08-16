import React from 'react';

class DownloadListItem extends React.Component {
    render() {
        let {key, url, label} = this.props;
        return <li><a key={key} href={url} download>{label}</a></li>;
    }
}

class DownloadButton extends React.Component {
    render() {
        let {tabDelimitedURL, csvDelimitedURL, rawDataURL} = this.props;
        let downloadItems = [];
        if (rawDataURL) {
            downloadItems.push(<DownloadListItem key="rawData" url={rawDataURL} label="Raw Data" />);
        }
        downloadItems.push(<DownloadListItem key="tabDelim" url={tabDelimitedURL} label="Tab Delimited" />);
        downloadItems.push(<DownloadListItem key="csvDelim" url={csvDelimitedURL} label="CSV Format" />);
        return <div className="dropup" style={{display:'inline'}}>
                        <button className="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1"
                                data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"
                                style={{verticalAlign:'top', marginLeft:'20px', marginTop:'20px'}}
                        >Download All Data</button>
                        <ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
                            {downloadItems}
                        </ul>
                    </div>
    }
}



export default DownloadButton;
