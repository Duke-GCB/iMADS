import React from 'react';
import PagingButtons from './PagingButtons.jsx'
import GetLinkDialog from './GetLinkDialog.jsx'
import DownloadButton from './DownloadButton.jsx'
require('./SearchResultsFooter.css');

class SearchResultsFooter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showGetUrlDialog: false,
            shareUrl: ''
        };
    }

    componentWillUpdate() {
        if (this.scrollToTop) {
            let resultsGridContainer = document.getElementById('resultsGridContainer');
            resultsGridContainer.scrollTop = 0;
            this.scrollToTop = false;
        }
    }

    changePage = (page) => {
        let {searchOperations} = this.props;
        searchOperations.changePage(page);
    };

    showGetLinkDialog = () => {
        this.setState({
            showGetUrlDialog: true
        });
    };

    hideGetLinkDialog = () => {
        this.setState({
            showGetUrlDialog: false,
            shareUrl: ''
        });
    };

    render() {
        let {searchSettings, searchResults, searchDataLoaded, dataStore, page} = this.props;
        let footer = <div></div>;
        let {startPage, endPage} = dataStore.pageBatch.getStartAndEndPages(page);
        if (searchDataLoaded) {
            if (searchResults.length > 0) {
                footer = <nav>
                    <PagingButtons startPage={startPage} currentPage={page} endPage={endPage}
                                   changePage={this.changePage}
                                   pageBatch={dataStore.pageBatch}
                    />
                    &nbsp;
                    <DownloadButton
                        searchSettings={searchSettings}
                        dataStore={dataStore} />
                    <button className="btn btn-default SearchResultsFooter_button" type="button"
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
