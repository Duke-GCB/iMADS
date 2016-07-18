import React from 'react';
import { browserHistory } from 'react-router'
import NavBar from '../common/NavBar.jsx'
import {SEARCH_NAV} from '../store/Navigation.js'
import SearchResultsPanel from './SearchResultsPanel.jsx'
import PageTitle from '../common/PageTitle.jsx'
import SearchFilterPanel from './SearchFilterPanel.jsx'
import PredictionsStore from '../store/PredictionsStore.js'
import URLBuilder from '../store/URLBuilder.js'
import PageBatch from '../store/PageBatch.js'
import {fetchPredictionSettings} from '../store/PredictionSettings.js'
import {ITEMS_PER_PAGE, NUM_PAGE_BUTTONS} from '../store/AppSettings.js'

class SearchPage extends React.Component {
     constructor(props) {
         super(props);
         let pageBatch = new PageBatch(NUM_PAGE_BUTTONS, ITEMS_PER_PAGE);
         this.predictionStore = new PredictionsStore(pageBatch, new URLBuilder($.ajax));
         let {searchSettings, customListWithoutData} = this.predictionStore.createSettingsFromQueryParams(props.location.query);
         let searchDataLoaded = customListWithoutData;
         this.state = {
             genomeData: {},
             searchResults: [],
             searchSettings: searchSettings,
             currentPage: 1,
             nextPages: 0,
             searchDataLoaded: searchDataLoaded,
             errorMessage: "",
             showCustomDialog: customListWithoutData,
             showGeneNamesWarnings: true,
         };
         this.search = this.search.bind(this);
         this.downloadAll = this.downloadAll.bind(this);
         this.changePage = this.changePage.bind(this);
         this.setErrorMessage = this.setErrorMessage.bind(this);
         this.searchFirstPage = this.searchFirstPage.bind(this);
         this.onError = this.onError.bind(this);
         this.onSearchData = this.onSearchData.bind(this);
    }

    setErrorMessage(msg) {
        this.setState({
            errorMessage: msg,
            searchDataLoaded: true,
        })
    }

    componentDidMount() {
        fetchPredictionSettings(function(genomes, maxBindingOffset) {
            this.setState({
                genomeData: genomes,
                maxBindingOffset: maxBindingOffset,
            }, this.searchFirstPage);
        }.bind(this), this.onError);
    }

    searchFirstPage() {
        this.search(this.state.searchSettings, 1);
    }

    search(searchSettings, page) {
        let {canRun, errorMessage} = this.predictionStore.checkSettings(searchSettings, this.state.maxBindingOffset);
        if (!canRun) {
            this.setErrorMessage(errorMessage);
            return;
        }
        var sameState = searchSettings == this.state.searchSettings;
        this.setState({
            searchSettings: searchSettings,
            page: page,
            perPage: this.perPage,
            searchDataLoaded: false,
            showGeneNamesWarnings: !sameState
        });
        this.predictionStore.requestPage(page, searchSettings, this.onSearchData, this.onError);
        browserHistory.push(this.predictionStore.makeLocalUrl(searchSettings));
    }

    onSearchData(predictions, pageNum, hasNextPages, warning) {
        if (warning) {
            if (!(this.predictionStore.isGeneWarningMessage(warning) && !this.state.showGeneNamesWarnings)) {
                alert(warning);
            }
        }
        this.setState({
            searchResults: predictions,
            nextPages: hasNextPages,
            searchDataLoaded: true,
            page: pageNum,
            errorMessage: '',
            showGeneNamesWarnings: false
        });
    }

    onError(err) {
        this.setErrorMessage(err.message);
    }

    changePage(page) {
        this.search(this.state.searchSettings, page)
    }

    downloadAll(format) {
        return this.predictionStore.getDownloadURL(format, this.state.searchSettings);
    }

    render () {
        let searchOperations = {
            search: this.search,
            changePage: this.changePage,
            downloadAll: this.downloadAll,
            setErrorMessage: this.setErrorMessage
        };
        return <div>
            <NavBar selected={SEARCH_NAV.path} />
            <div className="container" style={{width:'100%'}}>
                    <div className="row">
                        <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-2 col-col-md-10 col-sm-10" >
                            <PageTitle>TF Binding Predictions</PageTitle>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-2 col-sm-2 col-xs-2"  >
                                <SearchFilterPanel
                                        genomeData={this.state.genomeData}
                                        search={this.search}
                                        searchSettings={this.state.searchSettings}
                                        maxBindingOffset={this.state.maxBindingOffset}
                                        setErrorMessage={this.setErrorMessage}
                                        showCustomDialog={this.state.showCustomDialog}
                                />
                        </div>
                        <div className="col-md-10 col-sm-10 col-xs-10" >
                            <SearchResultsPanel
                                genomeData={this.state.genomeData}

                                searchSettings={this.state.searchSettings}
                                searchResults={this.state.searchResults}
                                page={this.state.page}
                                nextPages={this.state.nextPages}

                                searchDataLoaded={this.state.searchDataLoaded}
                                errorMessage={this.state.errorMessage}
                                showCustomDialog={this.state.showCustomDialog}

                                predictionStore={this.predictionStore}
                                searchOperations={searchOperations}
                            />
                        </div>

                    </div>

                </div>

            </div>
    }

}

export default SearchPage;
