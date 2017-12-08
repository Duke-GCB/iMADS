import React from 'react';
import { browserHistory } from 'react-router'
import Page from '../common/Page.jsx';
import {SEARCH_NAV} from '../models/Navigation.js'
import SearchResultsPanel from './SearchResultsPanel.jsx'
import PageTitle from '../common/PageTitle.jsx'
import SearchFilterPanel from './SearchFilterPanel.jsx'
import TFColorPickers from '../common/TFColorPickers.jsx';
import ThreePanelPane from '../common/ThreePanelPane.jsx';
import PredictionsStore from '../models/PredictionsStore.js'
import URLBuilder from '../models/URLBuilder.js'
import PageBatch from '../models/PageBatch.js'
import {fetchPredictionSettings} from '../models/PredictionSettings.js'
import {ITEMS_PER_PAGE, NUM_PAGE_BUTTONS} from '../models/AppSettings.js'
import {getPreferenceSettings, getCoreRange} from '../models/GenomeData.js';
import {SessionStorage, SEARCH_PAGE_KEY} from '../models/SessionStorage.js';


class SearchPage extends React.Component {
     constructor(props) {
         super(props);
         let pageBatch = new PageBatch(NUM_PAGE_BUTTONS, ITEMS_PER_PAGE);
         this.predictionStore = new PredictionsStore(pageBatch, new URLBuilder($.ajax));
         let {searchSettings, customListWithoutData} = this.predictionStore.createSettingsFromQueryParams(props.location.query);
         if (!searchSettings.genome) {
             let searchSettingsLastVisit = new SessionStorage().getValue(SEARCH_PAGE_KEY);
             if (searchSettingsLastVisit) {
                 searchSettings = searchSettingsLastVisit;
             }
         }
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
             predictionColor: TFColorPickers.defaultColorObj(),
             preferenceSettings: {},
         };
    }

    setErrorMessage = (msg) => {
        this.setState({
            errorMessage: msg,
            searchDataLoaded: true,
        });
    };

    componentDidMount() {
        fetchPredictionSettings(function(genomes, maxBindingOffset) {
            this.setState({
                genomeData: genomes,
                maxBindingOffset: maxBindingOffset,
            }, this.searchFirstPage);
        }.bind(this), this.onError);
    }

    componentWillUnmount() {
        new SessionStorage().putValue(SEARCH_PAGE_KEY, this.state.searchSettings);
    }

    searchFirstPage = () => {
        this.search(this.state.searchSettings, 1);
    };

    search = (searchSettings, page) => {
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
    };

    onSearchData = (predictions, pageNum, hasNextPages, warning) => {
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
    };

    onError = (err) => {
        this.setErrorMessage(err.message);
    };

    changePage = (page) => {
        this.search(this.state.searchSettings, page)
    };

    setPredictionColor = (colorObject) => {
        this.setState({
            predictionColor: colorObject
        })
    };

    render () {
        let preferenceSettings = getPreferenceSettings(this.state.genomeData,
            this.state.searchSettings.genome,
            this.state.searchSettings.model);
        let predictionColor = Object.assign({}, this.state.predictionColor);
        Object.assign(predictionColor, preferenceSettings);

        let coreRange = getCoreRange(this.state.genomeData,
            this.state.searchSettings.genome,
            this.state.searchSettings.model);

        let searchOperations = {
            search: this.search,
            changePage: this.changePage,
            setErrorMessage: this.setErrorMessage
        };
        let topPanel = <PageTitle>TF Binding Predictions</PageTitle>;
        let leftPanel = <SearchFilterPanel
                                        genomeData={this.state.genomeData}
                                        search={this.search}
                                        searchSettings={this.state.searchSettings}
                                        maxBindingOffset={this.state.maxBindingOffset}
                                        setErrorMessage={this.setErrorMessage}
                                        showCustomDialog={this.state.showCustomDialog}
                                        predictionColor={predictionColor}
                                        setPredictionColor={this.setPredictionColor}
                                        preferenceSettings={preferenceSettings}
                                />;
        let rightPanel = <SearchResultsPanel
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
                                predictionColor={predictionColor}
                                preferenceSettings={preferenceSettings}
                                coreRange={coreRange}
                            />;
        return <Page nav_path={SEARCH_NAV.path} >
                <ThreePanelPane
                    topPanel={topPanel}
                    leftPanel={leftPanel}
                    rightPanel={rightPanel}
                />
            </Page>;
    }

}

export default SearchPage;
