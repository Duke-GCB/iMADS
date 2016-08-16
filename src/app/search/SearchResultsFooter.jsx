import React from 'react';
import PagingButtons from './PagingButtons.jsx'
import GetLinkDialog from './GetLinkDialog.jsx'
import DownloadButton from './DownloadButton.jsx'

class SearchResultsFooter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showGetUrlDialog: false,
            shareUrl: ''
        }
        this.downloadCsv = this.downloadCsv.bind(this);
        this.downloadTabDelimited = this.downloadTabDelimited.bind(this);
        this.changePage = this.changePage.bind(this);
        this.showGetLinkDialog = this.showGetLinkDialog.bind(this);
        this.hideGetLinkDialog = this.hideGetLinkDialog.bind(this);
    }

    searchOperations() {
        return this.props.searchOperations;
    }

    componentWillUpdate() {
        if (this.scrollToTop) {
            let resultsGridContainer = document.getElementById('resultsGridContainer');
            resultsGridContainer.scrollTop = 0;
            this.scrollToTop = false;
        }
    }

    changePage(page) {
        this.searchOperations().changePage(page);
    }

    downloadCsv() {
        return this.searchOperations().downloadAll('csv');
    }

    downloadTabDelimited() {
        return this.searchOperations().downloadAll('tsv');
    }

    downloadRawDataURL() {
        if (this.searchOperations().downloadRawData) {
            return this.searchOperations().downloadRawData();
        }
        return '';
    }

    showGetLinkDialog() {
        this.setState({
            showGetUrlDialog: true
        });
    }

    hideGetLinkDialog() {
        this.setState({
            showGetUrlDialog: false,
            shareUrl: ''
        });
    }

    render() {
        let {searchSettings, searchResults, searchDataLoaded, predictionStore, page} = this.props;
        let footer = <div></div>;
        let {startPage, endPage} = predictionStore.pageBatch.getStartAndEndPages(page);
        if (searchDataLoaded) {
            if (searchResults.length > 0) {
                footer = <nav>
                    <PagingButtons startPage={startPage} currentPage={page} endPage={endPage}
                                   changePage={this.changePage}
                                   pageBatch={predictionStore.pageBatch}
                    />
                    &nbsp;
                    <DownloadButton
                        tabDelimitedURL={this.downloadTabDelimited()}
                        csvDelimitedURL={this.downloadCsv()}
                        rawDataURL={this.downloadRawDataURL()} />
                    <button className="btn btn-default" type="button"
                            style={{verticalAlign:'top', marginLeft:'20px', marginTop:'20px'}}
                            onClick={this.showGetLinkDialog} >Share</button>
                    <GetLinkDialog isOpen={this.state.showGetUrlDialog}
                                   searchSettings={searchSettings}
                                   closeDialog={this.hideGetLinkDialog}/>
                </nav>
            }
        }
        return footer;
    }
}

export default SearchResultsFooter;