import React from 'react';
import { browserHistory } from 'react-router'
import SearchResultsPanel from './SearchResultsPanel.jsx'
import PredictionsStore from '../store/PredictionsStore.js'
import URLBuilder from '../store/URLBuilder.js'
import PageBatch from '../store/PageBatch.js'
import StreamValue from '../store/StreamValue.js'
import NavBar from '../common/NavBar.jsx'
import {SEARCH_NAV} from '../store/Navigation.js'


const ITEMS_PER_PAGE = 100;
const NUM_PAGE_BUTTONS = 5;


class SearchPage extends React.Component {
     constructor(props) {
         super(props);
         var searchSettings = {};
         this.runSearchOnMount = false;
         var query = props.location.query;
         if (query.genome) {
            searchSettings = {
                    genome: query.genome,
                    gene_list: query.gene_list,
                    model: query.model,
                    all: (query.all === 'true'),
                    upstream: query.upstream,
                    upstreamValid: true,
                    downstream: query.downstream,
                    downstreamValid: true,
                    maxPredictionSort: (query.maxPredictionSort  === 'true'),
                    showCustomDialog: false,
                    customListData: '',
                };
             this.runSearchOnMount = true;
         }
         this.state = {
             genome_data: {},
             search_results: [],
             search_settings: searchSettings,
             current_page: 1,
             next_pages: 0,
             genome_data_loaded: false,
             search_data_loaded: false,
             errorMessage: "",
         };

         this.search = this.search.bind(this);
         this.download_all = this.download_all.bind(this);
         this.change_page = this.change_page.bind(this);
         this.setErrorMessage = this.setErrorMessage.bind(this);
         this.searchFirstPage = this.searchFirstPage.bind(this);
         var pageBatch = new PageBatch(NUM_PAGE_BUTTONS, ITEMS_PER_PAGE);
         var urlBuilder = new URLBuilder($.ajax);
         this.predictionStore = new PredictionsStore(pageBatch, urlBuilder);
         this.url="/api/v1/settings";
         this.items_per_page="100";
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
                genome_data: data.genomes,
                genome_data_loaded: true,
                max_binding_offset: data.max_binding_offset,
            }, this.searchFirstPage);
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.url, status, err.toString());
          }.bind(this)
        });
      }

    searchFirstPage() {
        if (this.runSearchOnMount) {
            this.search(this.state.search_settings, 1);
        }
    }

    search(search_settings, page) {
        this.setState({
            search_settings: search_settings,
            page: page,
            per_page: this.items_per_page,
            search_data_loaded: false,
        });
        var streamValue = new StreamValue(this.state.max_binding_offset);
        var upstreamError = streamValue.checkForError("Bases upstream", search_settings.upstream);
        var downstreamError = streamValue.checkForError("Bases downstream", search_settings.downstream);
        if (upstreamError || downstreamError) {
            var errorMessage = upstreamError;
            if (!errorMessage) {
                errorMessage = downstreamError;
            }
            this.setState({
                errorMessage: errorMessage,
                search_data_loaded: true,
            });
            return;
        }
        this.predictionStore.requestPage(page, search_settings, function(predictions, pageNum, hasNextPages) {
            this.setState({
                search_results: predictions,
                next_pages: hasNextPages,
                search_data_loaded: true,
                page: pageNum,
                errorMessage: '',
            });
        }.bind(this), function (err) {
            this.setState({
                errorMessage: err.message,
                search_data_loaded: true,
            });
        }.bind(this));
        var localUrl = new URLBuilder();
        this.predictionStore.addLocalUrl(localUrl, page, search_settings);
        browserHistory.push(localUrl.url);
    }

    change_page(page) {
        this.search(this.state.search_settings, page)
    }

    download_all(format) {
        return this.predictionStore.getDownloadURL(format, this.state.search_settings);
    }

    render () {
        return <div>
            <NavBar selected={SEARCH_NAV.path} />
            <SearchResultsPanel search_settings={this.state.search_settings}
                                       search_results={this.state.search_results}
                                       download_all={this.download_all}
                                       page={this.state.page}
                                       next_pages={this.state.next_pages}
                                       change_page={this.change_page}
                                       genome_data={this.state.genome_data}
                                       search={this.search}
                                       genome_data_loaded={this.state.genome_data_loaded}
                                       search_data_loaded={this.state.search_data_loaded}
                                       max_binding_offset={this.state.max_binding_offset}
                                       predictionStore={this.predictionStore}
                                       errorMessage={this.state.errorMessage}
                                       setErrorMessage={this.setErrorMessage}
            />
            </div>
    }

}

export default SearchPage;