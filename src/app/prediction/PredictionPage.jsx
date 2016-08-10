import React from 'react';
import {browserHistory} from 'react-router'
import NavBar from '../common/NavBar.jsx'
import {PREDICTION_NAV} from '../store/Navigation.js'
import ThreePanelPane from '../common/ThreePanelPane.jsx'
import PageTitle from '../common/PageTitle.jsx'
import PredictionFilterPanel from './PredictionFilterPanel.jsx'
import PredictionResultsPanel from './PredictionResultsPanel.jsx'
import PredictionsStore from '../store/PredictionsStore.js'
import URLBuilder from '../store/URLBuilder.js'
import PageBatch from '../store/PageBatch.js'
import {fetchPredictionSettings} from '../store/PredictionSettings.js'
import CustomResultSearch from '../store/CustomResultSearch.js';
import {CustomSequenceList} from '../store/CustomSequence.js';
import {ITEMS_PER_PAGE, NUM_PAGE_BUTTONS} from '../store/AppSettings.js'


class PredictionPage extends React.Component {
    constructor(props) {
        super(props);
        let pageBatch = new PageBatch(NUM_PAGE_BUTTONS, ITEMS_PER_PAGE);
        this.predictionStore = new PredictionsStore(pageBatch, new URLBuilder());
        this.customSequenceList = new CustomSequenceList();
        this.customResultSearch = new CustomResultSearch(this, pageBatch);
        let predictionSettings = this.customResultSearch.makeSettingsFromQuery(props.location.query);
        if (!predictionSettings.selectedSequence) {
            predictionSettings.selectedSequence = this.customSequenceList.getFirst();
        } else {
            this.customSequenceList.addIfNecessary(predictionSettings.selectedSequence);
        }
        this.state = {
            genomeData: {},
            searchResults: [],
            predictionSettings: predictionSettings,
            currentPage: 1,
            nextPages: 0,
            searchDataLoaded: true,
            errorMessage: "",
            showCustomDialog: false,
            showGeneNamesWarnings: true,
            loadingStatusLabel: "",
            predictionColor: "red",
            customSequenceList: this.customSequenceList.get(),
        };
    }

    componentDidMount() {
        fetchPredictionSettings(this.onReceiveGenomeData, this.onError);
    }

    onReceiveGenomeData = (genomes, maxBindingOffset) => {
        let predictionSettings = this.state.predictionSettings;
        if (!predictionSettings.model) {
            let genomeName = Object.keys(genomes)[0];
            predictionSettings.model = genomes[genomeName].models[0].name;
        }
        this.setState({
            genomeData: genomes,
            maxBindingOffset: maxBindingOffset,
            predictionSettings: predictionSettings
        }, this.searchFirstPage);
    }

    componentWillUnmount() {
        this.customResultSearch.cancel();
    }

    setPredictionColor = (colorName) => {
        this.setState({
            predictionColor: colorName
        })
    };

    setLoadingStatusLabel = (label) => {
        this.setState({
            loadingStatusLabel: label,
        });
    };

    setErrorMessage = (msg) => {
        this.setState({
            errorMessage: msg,
            searchDataLoaded: true,
        })
    };

    setPredictionSettings = (predictionSettings) => {
        let currentPredictionSettings = this.state.predictionSettings;
        Object.assign(currentPredictionSettings, predictionSettings);
        this.setState({
            predictionSettings: currentPredictionSettings
        }, this.search);
    };

    addCustomSeqenceList = (seqId, title, prexistingSequence) => {
        let currentPredictionSettings = this.state.predictionSettings;
        currentPredictionSettings.selectedSequence = seqId;
        if (this.customSequenceList.containsId(prexistingSequence.id)) {
            this.customSequenceList.replace(seqId, title, prexistingSequence.id);
        } else {
            this.customSequenceList.add(seqId, title);
        }
        this.setState({
            selectedSequence: seqId,
            predictionSettings: currentPredictionSettings
        }, this.search);
    };

    changePage = (page) => {
        this.setState({
            currentPage: page
        }, this.search);
    };

    searchFirstPage = () => {
        this.changePage(1);
    };

    search = () => {
        let predictionSettings = this.state.predictionSettings;
        let page = this.state.currentPage;
        let {model, selectedSequence} = predictionSettings;
        if (model && selectedSequence) {
            this.setState({
                searchDataLoaded: false,
            });
            this.customResultSearch.requestPage(page, predictionSettings, this.onSearchData, this.onError);
            browserHistory.push(this.customResultSearch.makeLocalUrl(predictionSettings));
        }
    };

    onSearchData = (predictions, pageNum, hasNextPages, warning) => {
        if (warning) {
            alert(warning);
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

    onError = (err)=> {
        this.setErrorMessage(err.message);
    };



    downloadAll = (format) => {
        return this.customResultSearch.getDownloadURL(format, this.state.predictionSettings);
    };

    downloadRawData = () => {
        return this.customResultSearch.getRawDownloadURL();
    }

    render() {
        let searchOperations = {
            search: this.search,
            changePage: this.changePage,
            downloadAll: this.downloadAll,
            downloadRawData: this.downloadRawData,
            setErrorMessage: this.setErrorMessage
        };
        let topPanel = <PageTitle>Custom DNA Predictions</PageTitle>;
        let leftPanel = <PredictionFilterPanel genomeData={this.state.genomeData}
                                               customSequenceList={this.state.customSequenceList}
                                               addCustomSeqenceList={this.addCustomSeqenceList}
                                               predictionSettings={this.state.predictionSettings}
                                               setPredictionSettings={this.setPredictionSettings}
                                               setErrorMessage={this.setErrorMessage}
                                               showCustomDialog={this.state.showCustomDialog}
                                               predictionColor={this.state.predictionColor}
                                               setPredictionColor={this.setPredictionColor}
        />;
        let rightPanel = <PredictionResultsPanel genomeData={this.state.genomeData}
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
        />;
        return <div>
            <NavBar selected={PREDICTION_NAV.path}/>
            <ThreePanelPane
                topPanel={topPanel}
                leftPanel={leftPanel}
                rightPanel={rightPanel}
            />
        </div>
    }

}

export default PredictionPage;