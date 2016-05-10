import React from 'react';

class DownloadButton extends React.Component {
    render() {
        let {tabDelimitedURL, csvDelimitedURL} = this.props;
        return <div className="dropup" style={{display:'inline'}}>
                        <button className="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1"
                                data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"
                                style={{verticalAlign:'top', marginLeft:'20px', marginTop:'20px'}}
                        >
                            Download All Data

                        </button>
                        <ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
                            <li><a href={tabDelimitedURL} download>Tab Delimited</a></li>
                            <li><a href={csvDelimitedURL} download>CSV Format</a></li>
                        </ul>
                    </div>
    }
}

export default DownloadButton;
