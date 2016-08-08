import React from 'react';
import StreamValue from '../store/StreamValue.js'
import SelectItem from '../common/SelectItem.jsx'
import BooleanInput from '../common/BooleanInput.jsx'
import ArrowTooltip from '../common/ArrowTooltip.jsx'
import ColorPicker from '../common/ColorPicker.jsx'
import UploadSequenceDialog from './UploadSequenceDialog.jsx'
import {CustomSequenceList} from '../store/CustomSequence.js';

const CUSTOM_SEQUENCE_LIST = 'Upload Custom Sequence';
const FIRST_TIME_INSTRUCTIONS = "Select '" + CUSTOM_SEQUENCE_LIST + "' to upload your first sequence.";

class PredictionFilterPanel extends React.Component {
    constructor(props) {
        super(props);
        this.customSeqenceList = new CustomSequenceList();
        let genomes = this.props.genomeData;
        let selectedGenome = '';
        let geneList = "";
        let model = "";
        let genomeNames = Object.keys(genomes);
        if (this.props.predictionSettings.genome) {
            let newSettings = this.props.predictionSettings;
            this.state = {
                genome: newSettings.genome,
                geneList: newSettings.geneList,
                model: newSettings.model.name,
                all: newSettings.all,
                upstream: newSettings.upstream,
                upstreamValid: true,
                downstream: newSettings.downstream,
                downstreamValid: true,
                maxPredictionSort: newSettings.maxPredictionSort,
                showCustomDialog: this.props.showCustomDialog,
                customListData: newSettings.customListData,
                customSequenceList: this.customSeqenceList.get(),
                selectedSequence: this.customSeqenceList.getFirst(),
            };
        } else {
            if (genomeNames.length > 0) {
                selectedGenome = genomeNames[0];
                let genomeData = genomes[selectedGenome];
                geneList = genomeData.geneLists[0];
                model = genomeData.models[0].name;
            }
            this.state = {
                genome: selectedGenome,
                geneList: geneList,
                model: model,
                all: false,
                upstream: 200,
                upstreamValid: true,
                downstream: 200,
                downStreamValid: true,
                maxPredictionSort: false,
                showCustomDialog: this.props.showCustomDialog,
                customListData: "",
                customSequenceList: this.customSeqenceList.get(),
                selectedSequence: this.customSeqenceList.getFirst(),
            };
        }
        this.onChangeGenome = this.onChangeGenome.bind(this);
        this.onChangeModel = this.onChangeModel.bind(this);
        this.onChangeGeneList = this.onChangeGeneList.bind(this);
        this.onChangeAll = this.onChangeAll.bind(this);
        this.onChangeUpstream = this.onChangeUpstream.bind(this);
        this.onChangeDownstream = this.onChangeDownstream.bind(this);
        this.onChangeMaxPredictionSort = this.onChangeMaxPredictionSort.bind(this);
        this.runSearch = this.runSearch.bind(this);
        this.closeCustomDialog = this.closeCustomDialog.bind(this);
        this.setShowCustomDialog = this.setShowCustomDialog.bind(this);
    }

    componentDidMount() {

    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.genomeData) {
            let genomeName = Object.keys(nextProps.genomeData)[0];
            let newState = this.switchGenomeState(nextProps.genomeData, genomeName);
            if (this.state.genome == '') {
                this.setState(newState, this.runSearch);
            }
            else {
                this.setState(newState);
            }
        }
    }

    onChangeGenome(e) {
        let value = e.target.value;
        this.setState(this.switchGenomeState(this.props.genomeData, value), this.runSearch);
    }

    switchGenomeState(genomeData, genomeName) {
        return {
            genome: genomeName,
            geneList: genomeData[genomeName]['geneLists'][0],
            model: genomeData[genomeName]['models'][0].name,
        };
    }

    onChangeGeneList(e) {
        let value = e.target.value;
        let isCustom = value === CUSTOM_SEQUENCE_LIST;
        let customListFilter = this.state.customListFilter;
        let customListData = this.state.customListData;
        if (!isCustom) {
            customListFilter = '';
        }
        if (value !== this.state.geneList) {
            customListData = '';
        }
        let func = this.runSearch;
        if (isCustom) {
            func = Function.prototype
        }
        this.setState({
            selectedSequence: e.target.value,
            showCustomDialog: isCustom,
            customListData: customListData,
            customListFilter: customListFilter,
        }, func);
    }

    setShowCustomDialog() {
        this.setState({
            showCustomDialog: true,
        });
    }

    closeCustomDialog(seqId, errorMessage) {
        if (seqId) {
            this.customSeqenceList.add(seqId);
        }
        this.setState({
            showCustomDialog: false,
            customSequenceList: this.customSeqenceList.get(),
            selectedSequence: seqId
        }, this.runSearch);
    }

    onChangeModel(e) {
        this.setState({model: e.target.value}, this.runSearch);
    }

    getGenomeInfo(genomeName) {
        return this.props.genomeData[genomeName];
    }

    onChangeAll(value) {
        this.setState({all: value}, this.runSearch);
    }

    onChangeUpstream(e) {
        let value = e.target.value;
        this.setState({upstream: value}, this.runSearch);
    }

    onChangeDownstream(e) {
        let value = e.target.value;
        this.setState({downstream: value}, this.runSearch);
    }

    onChangeMaxPredictionSort(value) {
        this.setState({maxPredictionSort: value}, this.runSearch);
    }

    updateValidationState() {
        let streamValue = new StreamValue(this.props.maxBindingOffset);
        let upstreamValid = streamValue.isValid(this.state.upstream);
        let downstreamValid = streamValue.isValid(this.state.downstream);
        this.setState({
            upstreamValid: upstreamValid,
            downstreamValid: downstreamValid,
        });
    }

    runSearch() {
        if (this.state.showCustomDialog) {
            return;
        }
        this.updateValidationState();
        this.props.search(this.state, 1);
    }

    render() {
        let {predictionColor, setPredictionColor} = this.props;

        let secondGroupStyle = {marginLeft: '40px'};
        let streamInputStyle = {display: 'inline', width: '4em', marginRight: '10px'};
        let smallMargin = {margin: '10px'}
        let smallMarginRight = {marginLeft: '10px'}
        let assemblyOptions = [];
        let proteinOptions = [];
        let geneListOptions = [];
        let currentGenome = this.state.genome;
        let geneListNames = [];

        if (this.props.genomeData) {
            let genomeTypes = Object.keys(this.props.genomeData);
            for (let i = 0; i < genomeTypes.length; i++) {
                let name = genomeTypes[i];
                let genomeInfo = this.props.genomeData[name];
                assemblyOptions.push(<option key={name} value={name}>{name}</option>);
                if (name === currentGenome) {
                    genomeInfo.models.forEach(function (model) {
                        proteinOptions.push(<option key={model.name} value={model.name}>{model.name}</option>);
                    });
                }
            }

        }
        let idx = 1;
        for (let value of this.state.customSequenceList) {
            let label = "Custom Sequence " + idx;
            geneListOptions.push(<option key={value} value={value}>{label}</option>);
            idx++;
        }

        if (this.customSeqenceList.isEmpty()) {
            geneListOptions.push(<option key=""></option>);
        }
        geneListOptions.push(<option key="customGeneList"  value={CUSTOM_SEQUENCE_LIST}>{CUSTOM_SEQUENCE_LIST}</option>);
        let geneListTitle = <div>
            Custom DNA:
        </div>;
        let disableUpstreamDownstream = false;
        let uploadInstructions = <ArrowTooltip label={FIRST_TIME_INSTRUCTIONS}
                                               visible={this.customSeqenceList.isEmpty()} />
        return <div>
            <h4>Filter</h4>
            <SelectItem title="Protein/Model:" selected={this.state.model} options={proteinOptions}
                        onChange={this.onChangeModel}/>
            <SelectItem title={geneListTitle}
                        selected={this.state.selectedSequence}
                        options={geneListOptions}
                        onChange={this.onChangeGeneList}
                        labelControl={uploadInstructions} />
            <BooleanInput checked={this.state.maxPredictionSort} label="Sort by max value"
                          onChange={this.onChangeMaxPredictionSort}/>
            <BooleanInput checked={this.state.all} label="All values (heatmap)"
                          onChange={this.onChangeAll}/>
            <ColorPicker label="Values Color:" color={predictionColor} setColor={setPredictionColor} />
            <UploadSequenceDialog type={this.state.geneList}
                                  isOpen={this.state.showCustomDialog}
                                  onRequestClose={this.closeCustomDialog}
                                  geneListNames={geneListNames}
            
            />
        </div>
    }
}

export default PredictionFilterPanel;
