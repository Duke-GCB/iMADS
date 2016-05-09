import React from 'react';
import { browserHistory } from 'react-router'
import SearchResultsPanel from './SearchResultsPanel.jsx'
import PredictionsStore from '../store/PredictionsStore.js'
import URLBuilder from '../store/URLBuilder.js'
import PageBatch from '../store/PageBatch.js'
import StreamValue from '../store/StreamValue.js'
import NavBar from '../common/NavBar.jsx'
import {SEARCH_NAV} from '../store/Navigation.js'
import {isCustomList} from '../store/CustomList.js'
import {getAndLogErrorMessage} from '../store/AjaxErrorMessage.js'


const ITEMS_PER_PAGE = 20;
const NUM_PAGE_BUTTONS = 5;


class SearchPage extends React.Component {
     constructor(props) {
         super(props);
         let searchSettings = {};
         this.runSearchOnMount = false;
         let searchDataLoaded = false;
         let showCustomDialog = false;
         let query = props.location.query;
         if (query.genome) {
            searchSettings = {
                    genome: query.genome,
                    geneList: query.geneList,
                    model: query.model,
                    all: (query.all === 'true'),
                    upstream: query.upstream,
                    upstreamValid: true,
                    downstream: query.downstream,
                    downstreamValid: true,
                    maxPredictionSort: (query.maxPredictionSort  === 'true'),
                    showCustomDialog: false,
                    customListData: query.customListData,
                    customListFilter: query.customListFilter,
                };
             if (isCustomList(searchSettings.geneList) && ! searchSettings.customListData) {
                 searchDataLoaded = true;
                 showCustomDialog = true;
             } else {
                 this.runSearchOnMount = true;
             }
         }
         this.state = {
             genomeData: {},
             searchResults: [],
             searchSettings: searchSettings,
             currentPage: 1,
             nextPages: 0,
             genomeDataLoaded: false,
             searchDataLoaded: searchDataLoaded,
             errorMessage: "",
             showCustomDialog: showCustomDialog,
         };
         this.search = this.search.bind(this);
         this.downloadAll = this.downloadAll.bind(this);
         this.changePage = this.changePage.bind(this);
         this.setErrorMessage = this.setErrorMessage.bind(this);
         this.searchFirstPage = this.searchFirstPage.bind(this);
         let pageBatch = new PageBatch(NUM_PAGE_BUTTONS, ITEMS_PER_PAGE);
         let urlBuilder = new URLBuilder($.ajax);
         this.predictionStore = new PredictionsStore(pageBatch, urlBuilder);
         this.url = "/api/v1/settings";
    }

    setErrorMessage(msg) {
        this.setState({
            errorMessage: msg,
        })
    }

    componentDidMount() {
        $.ajax({
          url: this.url,
          dataType: 'json',
            type: 'GET',
          cache: false,
          success: function(data) {
            this.setState({
                genomeData: data.genomes,
                genomeDataLoaded: true,
                maxBindingOffset: data.maxBindingOffset,
            }, this.searchFirstPage);
          }.bind(this),
          error: function(xhr, status, err) {
              let message = getAndLogErrorMessage('fetching genome metadata', xhr, status, err);
              alert(message);
          }.bind(this)
        });
      }

    searchFirstPage() {
        if (this.runSearchOnMount) {
            this.search(this.state.searchSettings, 1);
        }
    }

    search(searchSettings, page) {
        if (isCustomList(searchSettings.geneList)) {
            if (!searchSettings.customListData) {
                return;
            }
        }
        this.setState({
            searchSettings: searchSettings,
            page: page,
            perPage: this.perPage,
            searchDataLoaded: false,
        });
        let streamValue = new StreamValue(this.state.maxBindingOffset);
        let upstreamError = streamValue.checkForError("Bases upstream", searchSettings.upstream);
        let downstreamError = streamValue.checkForError("Bases downstream", searchSettings.downstream);
        if (upstreamError || downstreamError) {
            let errorMessage = upstreamError;
            if (!errorMessage) {
                errorMessage = downstreamError;
            }
            this.setState({
                errorMessage: errorMessage,
                searchDataLoaded: true,
            });
            return;
        }
        this.predictionStore.requestPage(page, searchSettings, function(predictions, pageNum, hasNextPages, warning) {
            this.setState({
                searchResults: predictions,
                nextPages: hasNextPages,
                searchDataLoaded: true,
                page: pageNum,
                errorMessage: '',
            });
            if (warning) {
                alert(warning);
            }
        }.bind(this), function (err) {
            this.setState({
                errorMessage: err.message,
                searchDataLoaded: true,
            });
        }.bind(this));
        let localUrl = new URLBuilder();
        this.predictionStore.addLocalUrl(localUrl, page, searchSettings);
        browserHistory.push(localUrl.url);
    }

    changePage(page) {
        this.search(this.state.searchSettings, page)
    }

    downloadAll(format) {
        return this.predictionStore.getDownloadURL(format, this.state.searchSettings);
    }

    render () {
        return <div>
            <NavBar selected={SEARCH_NAV.path} />
            <SearchResultsPanel searchSettings={this.state.searchSettings}
                                       searchResults={this.state.searchResults}
                                       downloadAll={this.downloadAll}
                                       page={this.state.page}
                                       nextPages={this.state.nextPages}
                                       changePage={this.changePage}
                                       genomeData={this.state.genomeData}
                                       search={this.search}
                                       getSharableUrl={this.getSharableUrl}
                                       genomeDataLoaded={this.state.genomeDataLoaded}
                                       searchDataLoaded={this.state.searchDataLoaded}
                                       maxBindingOffset={this.state.maxBindingOffset}
                                       predictionStore={this.predictionStore}
                                       errorMessage={this.state.errorMessage}
                                       setErrorMessage={this.setErrorMessage}
                                       showCustomDialog={this.state.showCustomDialog}
            />
            </div>
    }

}

export default SearchPage;
