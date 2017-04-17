import React from 'react';
import {browserHistory} from 'react-router'
import Page from '../common/Page.jsx';
import {PREDICTION_NAV} from '../models/Navigation.js'
import ThreePanelPane from '../common/ThreePanelPane.jsx'
import PageTitle from '../common/PageTitle.jsx'
import PageContent from '../common/PageContent.jsx'
import PredictionFilterPanel from './PredictionFilterPanel.jsx'
import PredictionResultsPanel from './PredictionResultsPanel.jsx'
import TFColorPickers from '../common/TFColorPickers.jsx';
import UploadSequencePane from './UploadSequencePane.jsx';
import ProgressTable from '../common/ProgressTable.jsx';
import TitledPanel from '../common/TitledPanel.jsx';
import PredictionsStore from '../models/PredictionsStore.js'
import URLBuilder from '../models/URLBuilder.js'
import PageBatch from '../models/PageBatch.js'
import {fetchPredictionSettings} from '../models/PredictionSettings.js'
import CustomResultSearch from '../models/CustomResultSearch.js';
import CustomResultList from '../models/CustomResultList.js';
import {CustomSequenceList} from '../models/CustomSequence.js';
import {ITEMS_PER_PAGE, NUM_PAGE_BUTTONS} from '../models/AppSettings.js'
import {formatModelName} from '../models/Model.js';
import {SEQUENCE_NOT_FOUND} from '../models/Errors.js';
import {getPreferenceSettings, getCoreRange, getFirstGenomeName} from '../models/GenomeData.js';
import {SessionStorage, PREDICTION_PAGE_KEY} from '../models/SessionStorage.js';
let moment = require('moment');

const DEFAULT_MODEL_NAME_PATTERN = 'Elk1_0004_vs_Ets1_0005';

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
                this.applyFirstCustomSequence(predictionSettings);
            }
        } else {
            this.customSequenceList.addIfNecessary(predictionSettings.selectedSequence);
        }
        if (predictionSettings.selectedSequence) {
            showInputPane = false;
        }
        var loadingCustomResultList = !this.customSequenceList.isEmpty();
        this.state = {
            genomeData: {},
            searchResults: [],
            predictionSettings: predictionSettings,
            currentPage: 1,
            nextPages: 0,
            searchDataLoaded: true,
            errorMessage: "",
            showGeneNamesWarnings: true,
            loadingStatusLabel: "",
            predictionColor: TFColorPickers.defaultColorObj(),
            customSequenceList: this.customSequenceList.get(),
            jobDates: {},
            showInputPane: showInputPane,
            customSequenceName: this.makeDefaultCustomSequenceName(),
            loadingCustomResultList: loadingCustomResultList,
            customResultList: [],
            generatingSequence: {},
            uploadSequenceData: {
                loadSequenceId: '',
                sequenceName: '',
                model: '',
                showLoadSampleLink: true,
            }
        };
        if (loadingCustomResultList) {
            this.customResultList.fetch();
        }
    }

    applyFirstCustomSequence = (predictionSettings) => {
        let firstSequence = this.customSequenceList.getFirst();
        if (firstSequence) {
            predictionSettings.selectedSequence = firstSequence.id;
            predictionSettings.model = firstSequence.model;
            return true;
        } else {
            predictionSettings.selectedSequence = '';
            return false;
        }
    };

    setUploadSequenceData = (uploadSequenceData) => {
        this.setState({
            uploadSequenceData: uploadSequenceData
        });
    };

    makeDefaultCustomSequenceName = () => {
        return "Sequence List " + moment().format('MM/DD HH:mm');
    };

    cancelPredictionGeneration = () => {
        var {predictionSettings, generatingSequence, uploadSequenceData} = this.state;
        var canceledSequenceId = generatingSequence.seqId;
        // undo selection of canceled sequence
        predictionSettings.selectedSequence = generatingSequence.previousSelectedSequence;
        predictionSettings.model = generatingSequence.previousModel;
        // load up the canceled data so the user can edit and resubmit
        uploadSequenceData.loadSequenceId = canceledSequenceId;
        // the canceled sequence should not persist for this user
        this.customSequenceList.remove(canceledSequenceId);
        this.setState({
            errorMessage: '',
            searchDataLoaded: true,
            loadingCustomResultList: false,
            showInputPane: true,
            generatingSequence: {},
            uploadSequenceData: uploadSequenceData,
            predictionSettings: predictionSettings
        });
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
        let uploadSequenceData = this.state.uploadSequenceData;

        if (!predictionSettings.model) {
            predictionSettings.model = this.getDefaultModelName(genomes);
        }
        if (!uploadSequenceData.model) {
            uploadSequenceData.model = this.getDefaultModelName(genomes);
        }
        this.setState({
            genomeData: genomes,
            maxBindingOffset: maxBindingOffset,
            predictionSettings: predictionSettings,
            uploadSequenceData: uploadSequenceData
        }, this.searchFirstPage);
    };

    getFirstGeneName = (genomes) => {
        let genomeName = Object.keys(genomes)[0];
        return genomes[genomeName].models[0].name;
    };

    getDefaultModelName(genomes, pattern) {
        let genomeName = Object.keys(genomes)[0];
        for (var model of genomes[genomeName].models) {
            if (model.name.includes(DEFAULT_MODEL_NAME_PATTERN)) {
                return model.name;
            }
        }
        return this.getFirstGeneName(genomes);
    }

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

    addCustomSequenceList = (seqId, model, title, previousSequenceId) => {
        let currentPredictionSettings = Object.assign({}, this.state.predictionSettings);
        let previousModel = currentPredictionSettings.model;
        currentPredictionSettings.selectedSequence = seqId;
        currentPredictionSettings.model = model;
        if (this.customSequenceList.containsId(previousSequenceId)) {
            this.customSequenceList.replace(seqId, title, model, previousSequenceId);
        } else {
            this.customSequenceList.add(seqId, title, model);
        }
        this.setState({
            predictionSettings: currentPredictionSettings,
            showInputPane: false,
            previousModel: previousModel
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
        let {predictionSettings} = this.state;
        let page = this.state.currentPage;
        let {model, selectedSequence} = predictionSettings;
        if (model && selectedSequence) {
            this.customResultSearch.requestPage(page, predictionSettings, this.onSearchData, this.onError);
        }
    };

    onSearchData = (predictions, pageNum, hasNextPages, warning) => {
        if (warning) {
            alert(warning);
        }
        let predictionSettings = this.state.predictionSettings;
        browserHistory.push(this.customResultSearch.makeLocalUrl(predictionSettings));
        this.setState({
            searchResults: predictions,
            nextPages: hasNextPages,
            searchDataLoaded: true,
            page: pageNum,
            errorMessage: '',
            showGeneNamesWarnings: false,
            generatingSequence: {}
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
        if (this.applyFirstCustomSequence(predictionSettings)) {
            this.setState({
                customSequenceList: this.customSequenceList.get(),
                predictionSettings: predictionSettings
            }, this.search);
        } else {
            this.showUploadSequencePane(true);
        }
    };

    downloadAll = (format) => {
        return this.customResultSearch.getDownloadURL(format, this.state.predictionSettings);
    };

    downloadRawData = () => {
        return this.customResultSearch.getRawDownloadURL();
    };

    generatePredictionsForSequence = (seqId, model, title, previousSequenceId) => {
        var {predictionSettings} = this.state;
        this.setState({
            searchDataLoaded: false,
            generatingSequence: {
                seqId: seqId,
                model: model,
                title: title,
                previousSelectedSequence: predictionSettings.selectedSequence,
                previousModel: predictionSettings.model
            }
        });
        this.addCustomSequenceList(seqId, model, title, previousSequenceId);
    };

    viewExistingPredictions = () => {
        this.setState({
            showInputPane: false
        });
    };

    showUploadSequencePane = (createNewSequence) => {
        var {predictionSettings, uploadSequenceData} = this.state;
        var uploadSequenceData = this.state.uploadSequenceData;
        if (createNewSequence) {
            uploadSequenceData.loadSequenceId = '';
            uploadSequenceData.sequenceName = '';
            uploadSequenceData.showLoadSampleLink = true;
            uploadSequenceData.model = predictionSettings.model;
        } else { //editing existing sequence
            var loadSequenceId = predictionSettings.selectedSequence;
            var sequenceData = this.customSequenceList.lookup(loadSequenceId);
            var title = sequenceData.title;
            uploadSequenceData.loadSequenceId = loadSequenceId;
            uploadSequenceData.sequenceName = title;
            uploadSequenceData.showLoadSampleLink = false;
            uploadSequenceData.model = predictionSettings.model;
        }
        this.setState({
            showInputPane: true,
            uploadSequenceData: uploadSequenceData
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
        let {generatingSequence} = this.state;
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
                                               predictionColor={predictionColor}
                                               setPredictionColor={this.setPredictionColor}
                                               showTwoColorPickers={preferenceSettings.isPreference}
                                               showUploadSequencePane={this.showUploadSequencePane}
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
            if (!this.state.searchDataLoaded) {
                var title = "Generating Predictions for " + formatModelName(generatingSequence.model);
                content = <div className="centerVertically">
                    <TitledPanel title={title} subTitle={generatingSequence.title}>
                        <ProgressTable startedDate={this.state.jobDates.started}
                                   currentDate={this.state.jobDates.current}
                                   status={this.state.loadingStatusLabel}
                                   cancelOperation={this.cancelPredictionGeneration}/>
                    </TitledPanel>
                </div>;
            } else {
                if (this.state.showInputPane) {
                    content = <UploadSequencePane
                        genomeData={this.state.genomeData}
                        uploadSequenceData={this.state.uploadSequenceData}
                        setUploadSequenceData={this.setUploadSequenceData}
                        defaultSequenceName={this.state.customSequenceName}
                        generatePredictionsForSequence={this.generatePredictionsForSequence}
                        viewExistingPredictions={this.viewExistingPredictions}
                    />
                } else {
                    content = <ThreePanelPane
                        topPanel={topPanel}
                        leftPanel={leftPanel}
                        rightPanel={rightPanel}
                    />
                }
            }
        }
        return <Page nav_path={PREDICTION_NAV.path}>
            {content}
        </Page>
    }

}

export default PredictionPage;
