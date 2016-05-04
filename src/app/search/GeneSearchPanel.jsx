import React from 'react';
import StreamValue from '../store/StreamValue.js'
import CustomListDialog from './CustomListDialog.jsx'

const CUSTOM_GENE_LIST = 'Custom Gene List';
const CUSTOM_RANGES_LIST = 'Custom Ranges List';

class SelectItem extends React.Component {
    render() {
        var sel = this.props.selected;
        if (sel === "") {
            sel = 'ok';
        }
        return <div>
                    <label>
                        {this.props.title}
                    </label>
                        <select className="form-control" value={sel} onChange={this.props.onChange}>
                            {this.props.options}
                        </select>
                </div>
    }
}

class StreamInput extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.state = {
            isValid: true,
        }
    }

    onChange(evt) {
        var streamValue = new StreamValue(this.props.maxBindingOffset)
        var isValid = streamValue.isValid(evt.target.value);
        this.setState({
            isValid: isValid,
        })
        this.props.onChange(evt);
     }

    render() {
        var className = "form-control";
        if (!this.state.isValid) {
            className += " badValue"
        }
        return <div>
                    <label>{this.props.title}
                        <input type="text"
                               disabled={this.props.disabled}
                               className={className}
                               defaultValue={this.props.value}
                               onBlur={this.onChange}
                        />

                    </label>
                </div>
    }
}

class BooleanInput extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);

    }
    onChange(evt) {
        this.props.onChange(evt.target.checked);
    }
    render() {
        return <label>
                    <input type="checkbox"
                           checked={this.props.checked} onChange={this.onChange}
                    /> {this.props.label}
            </label>
    }
}

class GeneSearchPanel extends React.Component {
    constructor(props) {
        super(props);
        var genomes = this.props.genomeData;
        var selectedGenome = '';
        var geneList = "";
        var model = "";
        var genomeNames = Object.keys(genomes);
        if (this.props.searchSettings.genome) {
            var newSettings = this.props.searchSettings;
            this.state = {
                    genome: newSettings.genome,
                    geneList: newSettings.geneList,
                    model: newSettings.model,
                    all: newSettings.all,
                    upstream: newSettings.upstream,
                    upstreamValid: true,
                    downstream: newSettings.downstream,
                    downstreamValid: true,
                    maxPredictionSort: newSettings.maxPredictionSort,
                    showCustomDialog: this.props.showCustomDialog,
                    customListData: newSettings.customListData,
                };
        } else {
            if (genomeNames.length > 0) {
                selectedGenome = genomeNames[0];
                var genomeData = genomes[selectedGenome];
                geneList = genomeData.geneLists[0];
                model = genomeData.models[0];
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
            var genomeName = Object.keys(nextProps.genomeData)[0];
            var newState = this.switchGenomeState(nextProps.genomeData, genomeName);
            if (this.state.genome == '') {
                this.setState(newState, this.runSearch);
            }
            else {
                this.setState(newState);
            }

        }
        if (nextProps.searchSettings.genome) {
            var newSettings = nextProps.searchSettings;
            this.setState(
                {
                    genome: newSettings.genome,
                    geneList: newSettings.geneList,
                    model: newSettings.model,
                    all: newSettings.all,
                    upstream: newSettings.upstream,
                    downstream: newSettings.downstream,
                    maxPredictionSort: newSettings.maxPredictionSort,
                    customListData: newSettings.customListData,
                });
        }
    }

    onChangeGenome(e) {
        var value = e.target.value;
        this.setState(this.switchGenomeState(this.props.genomeData, value), this.runSearch);
    }

    switchGenomeState(genomeData, genomeName) {
        return {
                genome: genomeName,
                geneList: genomeData[genomeName]['geneLists'][0],
                model: genomeData[genomeName]['models'][0],
        };
    }

    onChangeGeneList(e) {
        var value = e.target.value;
        var isCustom = value === CUSTOM_GENE_LIST || value === CUSTOM_RANGES_LIST;
        var customListFilter = this.state.customListFilter;
        var customListData = this.state.customListData;
        if (!isCustom) {
            customListFilter = '';
        }
        if (value !== this.state.geneList) {
            customListData = '';
        }
        var func = this.runSearch;
        if (isCustom) {
            func = Function.prototype
        }
        this.setState({
            geneList: e.target.value,
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

    closeCustomDialog(customListData, customListFilter) {
        this.setState({
            showCustomDialog: false,
            customListData: customListData,
            customListFilter: customListFilter,
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
        var value = e.target.value;
        this.setState({upstream: value}, this.runSearch);
    }

    onChangeDownstream(e) {
        var value = e.target.value;
        this.setState({downstream: value}, this.runSearch);
    }

    onChangeMaxPredictionSort(value) {
        this.setState({maxPredictionSort: value}, this.runSearch);
    }

    updateValidationState() {
        var streamValue = new StreamValue(this.props.maxBindingOffset);
        var upstreamValid = streamValue.isValid(this.state.upstream);
        var downstreamValid = streamValue.isValid(this.state.downstream);
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
        var secondGroupStyle = {marginLeft:'40px'};
        var streamInputStyle = {display: 'inline', width:'4em', marginRight: '10px'};
        var smallMargin = { margin: '10px' }
        var smallMarginRight = { marginLeft: '10px' }
        var assemblyOptions = [];
        var proteinOptions = [];
        var geneListOptions = [];
        var currentGenome = this.state.genome;
        var geneListNames = [];
        if (this.props.genomeData) {
            var genomeTypes = Object.keys(this.props.genomeData);
            for (var i = 0; i < genomeTypes.length; i++) {
                var name = genomeTypes[i];
                var genomeInfo = this.props.genomeData[name];
                assemblyOptions.push(<option key={name} value={name}>{name}</option>);
                if (name === currentGenome) {
                    genomeInfo.models.forEach(function (model) {
                        proteinOptions.push(<option key={model}  value={model}>{model}</option>);
                    });
                    genomeInfo.geneLists.forEach(function (geneList) {
                        geneListOptions.push(<option key={geneList}  value={geneList}>{geneList}</option>);
                        geneListNames.push(geneList);
                    });
                }
            }
            geneListOptions.push(<option key="customGeneList"  value={CUSTOM_GENE_LIST}>{CUSTOM_GENE_LIST}</option>)
            geneListOptions.push(<option key="customRangeList"  value={CUSTOM_RANGES_LIST}>{CUSTOM_RANGES_LIST}</option>)
        }
        var geneListTitle = "Gene list:";
        var customListButton = [];
        if (this.state.geneList == CUSTOM_GENE_LIST || this.state.geneList == CUSTOM_RANGES_LIST) {
            geneListTitle = <div>
                Gene list:
            </div>;
            customListButton = <button type="button" className="btn btn-default btn-sm"
                        style={{marginTop: '5px', marginBottom: '10px', width: '100%'}}
                    onClick={this.setShowCustomDialog} >
                    Update Custom List
                </button>;
        }
        var disableUpstreamDownstream = false;
        if (this.state.geneList == CUSTOM_RANGES_LIST) {
            disableUpstreamDownstream = true;
        }
        return <div>
                <h4>Filter</h4>
                <SelectItem title="Assembly:" selected={this.state.genome} options={assemblyOptions}
                            onChange={this.onChangeGenome}/>
                <SelectItem title="Protein/Model:" selected={this.state.model} options={proteinOptions}
                            onChange={this.onChangeModel}/>
                <SelectItem title={geneListTitle} selected={this.state.geneList} options={geneListOptions}
                            onChange={this.onChangeGeneList}
                            />
                {customListButton}

                <StreamInput title="Bases upstream:" 
                             value={this.state.upstream} 
                             onChange={this.onChangeUpstream}
                             maxBindingOffset={this.props.maxBindingOffset}
                             isValid={this.state.upstreamValid}
                             disabled={disableUpstreamDownstream}
                              />
                <StreamInput title="Bases downstream:"
                             value={this.state.downstream} 
                             onChange={this.onChangeDownstream}
                             maxBindingOffset={this.props.maxBindingOffset}
                             isValid={this.state.downstreamValid}
                             disabled={disableUpstreamDownstream}
                             />
                <BooleanInput checked={this.state.maxPredictionSort} label="Sort by max value"
                              onChange={this.onChangeMaxPredictionSort} />
                <BooleanInput checked={this.state.all} label="Include all values"
                              onChange={this.onChangeAll} />
                <CustomListDialog type={this.state.geneList}
                                  isOpen={this.state.showCustomDialog}
                                  onRequestClose={this.closeCustomDialog}
                                  geneListNames={geneListNames}

                />
        </div>
    }
}

export default GeneSearchPanel;
