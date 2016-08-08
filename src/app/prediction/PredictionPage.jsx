import React from 'react';
import { browserHistory } from 'react-router'
import NavBar from '../common/NavBar.jsx'
import {PREDICTION_NAV} from '../store/Navigation.js'
import PredictionResultsPanel from './PredictionResultsPanel.jsx'
import PageTitle from '../common/PageTitle.jsx'
import PredictionFilterPanel from './PredictionFilterPanel.jsx'
import PredictionsStore from '../store/PredictionsStore.js'
import URLBuilder from '../store/URLBuilder.js'
import PageBatch from '../store/PageBatch.js'
import {fetchPredictionSettings} from '../store/PredictionSettings.js'
import {ITEMS_PER_PAGE, NUM_PAGE_BUTTONS} from '../store/AppSettings.js'
import CustomResultSearch from '../store/CustomResultSearch.js';

class PredictionPage extends React.Component {
     constructor(props) {
         super(props);
         let pageBatch = new PageBatch(NUM_PAGE_BUTTONS, ITEMS_PER_PAGE);
         this.predictionStore = new PredictionsStore(pageBatch, new URLBuilder($.ajax));
         //let {searchSettings, customListWithoutData} = this.predictionStore.createSettingsFromQueryParams(props.location.query);
         let customListWithoutData = undefined;
         let predictionSettings = {};
         let searchDataLoaded = true;//customListWithoutData;
         this.customResultSearch = new CustomResultSearch(this);
         this.state = {
             genomeData: {},
             searchResults: [],
             predictionSettings: predictionSettings,
             currentPage: 1,
             nextPages: 0,
             searchDataLoaded: searchDataLoaded,
             errorMessage: "",
             showCustomDialog: customListWithoutData,
             showGeneNamesWarnings: true,
             loadingStatusLabel: "",
             predictionColor: "red",
         };
         this.search = this.search.bind(this);
         this.downloadAll = this.downloadAll.bind(this);
         this.changePage = this.changePage.bind(this);
         this.setErrorMessage = this.setErrorMessage.bind(this);
         this.searchFirstPage = this.searchFirstPage.bind(this);
         this.onError = this.onError.bind(this);
         this.onSearchData = this.onSearchData.bind(this);
         this.setLoadingStatusLabel = this.setLoadingStatusLabel.bind(this);
    }

    setPredictionColor = (colorName) => {
        this.setState({
            predictionColor: colorName
        })
    }

    setLoadingStatusLabel(label) {
        this.setState({
            loadingStatusLabel: label,
        });
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
    
    componentWillUnmount() {
        this.customResultSearch.cancel();
    }

    searchFirstPage() {
        this.search(this.state.predictionSettings, 1);
    }

    search(predictionSettings, page) {
        let {model, selectedSequence} = predictionSettings;
        if (model && selectedSequence) {
            this.setState({
                predictionSettings: predictionSettings,
                searchDataLoaded: false,
            });
            this.customResultSearch.requestPage(page, predictionSettings, this.onSearchData, this.onError);
        }
        /*
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
        */
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
        this.search(this.state.predictionSettings, page)
    }

    downloadAll(format) {
        return this.predictionStore.getDownloadURL(format, this.state.predictionSettings);
    }

    render () {
        let searchOperations = {
            search: this.search,
            changePage: this.changePage,
            downloadAll: this.downloadAll,
            setErrorMessage: this.setErrorMessage
        };
        return <div>
            <NavBar selected={PREDICTION_NAV.path} />
            <div className="container" style={{width:'100%'}}>
                    <div className="row">
                        <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-2 col-col-md-10 col-sm-10" >
                            <PageTitle>Custom DNA Predictions</PageTitle>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-2 col-sm-2 col-xs-2"  >
                                <PredictionFilterPanel
                                        genomeData={this.state.genomeData}
                                        search={this.search}
                                        predictionSettings={this.state.predictionSettings}
                                        maxBindingOffset={this.state.maxBindingOffset}
                                        setErrorMessage={this.setErrorMessage}
                                        showCustomDialog={this.state.showCustomDialog}
                                        predictionColor={this.state.predictionColor}
                                        setPredictionColor={this.setPredictionColor}
                                />
                        </div>
                        <div className="col-md-10 col-sm-10 col-xs-10" >
                            <PredictionResultsPanel
                                genomeData={this.state.genomeData}

                                predictionSettings={this.state.predictionSettings}
                                searchResults={this.state.searchResults}
                                page={this.state.page}
                                nextPages={this.state.nextPages}

                                searchDataLoaded={this.state.searchDataLoaded}
                                loadingStatusLabel={this.state.loadingStatusLabel}
                                hasSequences={this.state.predictionSettings.selectedSequence}
                                errorMessage={this.state.errorMessage}
                                showCustomDialog={this.state.showCustomDialog}

                                predictionStore={this.predictionStore}
                                searchOperations={searchOperations}
                                predictionColor={this.state.predictionColor}
                            />
                        </div>

                    </div>

                </div>

            </div>
    }

}

export default PredictionPage;