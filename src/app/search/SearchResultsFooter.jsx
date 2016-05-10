import React from 'react';
import PagingButtons from './PagingButtons.jsx'
import GetLinkDialog from './GetLinkDialog.jsx'

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

    changePage(page){
        this.searchOperations().changePage(page);
    }

    downloadCsv() {
        return this.searchOperations().downloadAll('csv');
    }

    downloadTabDelimited() {
        return this.searchOperations().downloadAll('tsv');
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
        //bad hard coding
        let startPage = parseInt((page - 1)/ 5) * 5 + 1;
        let endPage = startPage + 4;
        if (searchDataLoaded) {
            if (searchResults.length > 0) {
                footer = <nav>
                    <PagingButtons startPage={startPage} currentPage={page} endPage={endPage}
                                   changePage={this.changePage}
                                   pageBatch={predictionStore.pageBatch}
                    />
                    &nbsp;
                    <div className="dropup" style={{display:'inline'}}>
                        <button className="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1"
                                data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"
                                style={{verticalAlign:'top', marginLeft:'20px', marginTop:'20px'}}
                        >
                            Download All Data

                        </button>
                        <ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
                            <li><a href={this.downloadTabDelimited()} download>Tab Delimited</a></li>
                            <li><a href={this.downloadCsv()} download>CSV Format</a></li>
                        </ul>
                    </div>
                        <button className="btn btn-default" type="button"
                                style={{verticalAlign:'top', marginLeft:'20px', marginTop:'20px'}}
                                onClick={this.showGetLinkDialog}
                        >
                            Share
                        </button>
                        <GetLinkDialog isOpen={this.state.showGetUrlDialog}
                                       searchSettings={searchSettings}
                                       closeDialog={this.hideGetLinkDialog} />
                </nav>
            } else {
                if (!this.props.errorMessage) {
                    listContent = <div className="centerChildrenHorizontally">
                        <span className="SearchResultsPanel__no_results_found centerVertically">No results found.</span>
                    </div>
                }
            }
        }        
        return footer;
    }
}

export default SearchResultsFooter;