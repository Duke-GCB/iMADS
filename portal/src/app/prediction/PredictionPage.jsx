import React from 'react';
import {browserHistory} from 'react-router'
import Page from '../common/Page.jsx';
import {PREDICTION_NAV} from '../models/Navigation.js'
import ThreePanelPane from '../common/ThreePanelPane.jsx'
import PageTitle from '../common/PageTitle.jsx'
import PredictionFilterPanel from './PredictionFilterPanel.jsx'
import PredictionResultsPanel from './PredictionResultsPanel.jsx'
import TFColorPickers from '../common/TFColorPickers.jsx';
import UploadSequencePane from './UploadSequencePane.jsx';
import PredictionsStore from '../models/PredictionsStore.js'
import URLBuilder from '../models/URLBuilder.js'
import PageBatch from '../models/PageBatch.js'
import {fetchPredictionSettings} from '../models/PredictionSettings.js'
import CustomResultSearch from '../models/CustomResultSearch.js';
import CustomResultList from '../models/CustomResultList.js';
import {CustomSequenceList} from '../models/CustomSequence.js';
import {ITEMS_PER_PAGE, NUM_PAGE_BUTTONS} from '../models/AppSettings.js'
import {SEQUENCE_NOT_FOUND} from '../models/Errors.js';
import {getPreferenceSettings, getCoreRange, getFirstGenomeName} from '../models/GenomeData.js';
import {SessionStorage, PREDICTION_PAGE_KEY} from '../models/SessionStorage.js';
let moment = require('moment');

const THREE_COLUMN_LEFT_PANEL = 2;

class PredictionPage extends React.Component {
    constructor(props) {
        super(props);
        let pageBatch = new PageBatch(NUM_PAGE_BUTTONS, ITEMS_PER_PAGE);
        this.predictionStore = new PredictionsStore(pageBatch, new URLBuilder());
        this.customSequenceList = new CustomSequenceList();
        this.customSequenceList.removeOld();
        this.customResultList = new CustomResultList(
            this.customSequenceList,
            this.customResultListFinishedLoading,
            this.setErrorMessage);
        this.customResultSearch = new CustomResultSearch(this, pageBatch, this.customResultList);
        let showInputPane = true;
        let predictionSettings = this.customResultSearch.makeSettingsFromQuery(props.location.query);
        if (!predictionSettings.selectedSequence) {
            let predictionSettingsLastVisit = new SessionStorage().getValue(PREDICTION_PAGE_KEY);
            if (predictionSettingsLastVisit) {
                predictionSettings = predictionSettingsLastVisit;
            } else {
                predictionSettings.selectedSequence = this.customSequenceList.getFirst();
            }
        } else {
            this.customSequenceList.addIfNecessary(predictionSettings.selectedSequence);
        }
        if (predictionSettings.selectedSequence) {
            showInputPane = false;
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
            predictionColor: TFColorPickers.defaultColorObj(),
            customSequenceList: this.customSequenceList.get(),
            jobDates: {},
            sequenceData: {},
            showInputPane: showInputPane,
            customSequenceName: this.makeDefaultCustomSequenceName(),
            loadingCustomResultList: true,
            customResultList: []
        };

        this.customResultList.fetch();
    }

    makeDefaultCustomSequenceName = () => {
        return "Sequence List " + moment().format('MM/DD HH:mm');
    };

    componentDidMount() {
        fetchPredictionSettings(this.onReceiveGenomeData, this.onError);
    }

    componentWillUnmount() {
        new SessionStorage().putValue(PREDICTION_PAGE_KEY, this.state.predictionSettings);
        this.customResultSearch.cancel();
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
    };

    setPredictionColor = (colorObject) => {
        this.setState({
            predictionColor: colorObject
        })
    };

    setLoadingStatusLabel = (label) => {
        this.setState({
            loadingStatusLabel: label,
        });
    };

    setJobDates = (jobDates) => {
        this.setState({
            jobDates: jobDates,
        });
    };

    setErrorMessage = (msg) => {
        this.setState({
            errorMessage: msg,
            searchDataLoaded: true,
            loadingCustomResultList: false,
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
            predictionSettings: currentPredictionSettings,
            showInputPane: false,
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
        console.log(err);
        let message = err.message;
        if (err.errorType == SEQUENCE_NOT_FOUND) {
            window.setTimeout(() => {
                this.removeExpiredSequence(err.errorData);
            }, 2000);
        }
        this.setErrorMessage(message);
    };

    removeExpiredSequence = (sequenceId) => {
        this.customSequenceList.remove(sequenceId);
        let predictionSettings = this.state.predictionSettings;
        predictionSettings.selectedSequence = this.customSequenceList.getFirst();
        this.setState({
            customSequenceList: this.customSequenceList.get(),
            predictionSettings: predictionSettings
        }, this.search);
    };

    downloadAll = (format) => {
        return this.customResultSearch.getDownloadURL(format, this.state.predictionSettings);
    };

    downloadRawData = () => {
        return this.customResultSearch.getRawDownloadURL();
    };

    closeCustomDialog = (seqId, errorMessage, title) => {
        if (seqId) {
            this.addCustomSeqenceList(seqId, title, this.state.sequenceData);
        }
        this.setState({
            showCustomDialog: false,
        });
    };

    setShowInputPane  = (value) => {
        this.setState({
            showInputPane: value,
        });
    };

    customResultListFinishedLoading = (errors) => {
        this.setState({
            loadingCustomResultList: false,
            customResultList: this.customResultList.get()
        });
        if (errors.length > 0) {
            alert(errors.join());
        }
    };

    render() {
        // Add preference min/max to color settings.
        let preferenceSettings = getPreferenceSettings(this.state.genomeData,
            getFirstGenomeName(this.state.genomeData),
            this.state.predictionSettings.model);
        let predictionColor = Object.assign({}, this.state.predictionColor);
        Object.assign(predictionColor, preferenceSettings);

        let coreRange = getCoreRange(this.state.genomeData,
            getFirstGenomeName(this.state.genomeData),
            this.state.predictionSettings.model);

        let searchOperations = {
            search: this.search,
            changePage: this.changePage,
            downloadAll: this.downloadAll,
            downloadRawData: this.downloadRawData,
            setErrorMessage: this.setErrorMessage
        };
        let noSequences = this.state.customSequenceList.length == 0;
        let topPanel = <PageTitle>Custom DNA Predictions</PageTitle>;
        let leftPanel = <PredictionFilterPanel genomeData={this.state.genomeData}
                                               customSequenceList={this.state.customSequenceList}
                                               addCustomSeqenceList={this.addCustomSeqenceList}
                                               predictionSettings={this.state.predictionSettings}
                                               setPredictionSettings={this.setPredictionSettings}
                                               setErrorMessage={this.setErrorMessage}
                                               showCustomDialog={this.state.showCustomDialog}
                                               predictionColor={predictionColor}
                                               setPredictionColor={this.setPredictionColor}
                                               showTwoColorPickers={preferenceSettings.isPreference}
                                               setShowInputPane={this.setShowInputPane}
                                               customResultList={this.state.customResultList}

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
                                                 predictionColor={predictionColor}
                                                 showBlankWhenEmpty={noSequences}
                                                 jobDates={this.state.jobDates}
                                                 coreRange={coreRange}
        />;
        let content;
        if (this.state.loadingCustomResultList) {
            content = <span>Loading..</span>;
        } else {
            if (this.state.showInputPane) {
                content = <UploadSequencePane
                    genomeData={this.state.genomeData}
                    predictionSettings={this.state.predictionSettings}
                    setPredictionSettings={this.setPredictionSettings}
                    sequenceData={this.state.sequenceData}
                    defaultSequenceName={this.state.customSequenceName}
                    onRequestClose={this.closeCustomDialog}
                    setShowInputPane={this.setShowInputPane}
                />
            } else {
                content = <ThreePanelPane
                    leftPanelSize={THREE_COLUMN_LEFT_PANEL}
                    topPanel={topPanel}
                    leftPanel={leftPanel}
                    rightPanel={rightPanel}
                />
            }
        }
        return <Page nav_path={PREDICTION_NAV.path}>
            {content}
        </Page>
    }

}

export default PredictionPage;
