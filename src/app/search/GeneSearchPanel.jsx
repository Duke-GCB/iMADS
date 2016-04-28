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
        var streamValue = new StreamValue(this.props.max_binding_offset)
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
        var genomes = this.props.genome_data;
        var selected_genome = '';
        var gene_list = "";
        var model = "";
        var genome_names = Object.keys(genomes);
        if (this.props.search_settings.genome) {
            var new_settings = this.props.search_settings;
            this.state = {
                    genome: new_settings.genome,
                    gene_list: new_settings.gene_list,
                    model: new_settings.model,
                    all: new_settings.all,
                    upstream: new_settings.upstream,
                    upstreamValid: true,
                    downstream: new_settings.downstream,
                    downstreamValid: true,
                    maxPredictionSort: new_settings.maxPredictionSort,
                    showCustomDialog: false,
                    customListData: new_settings.customListData,
                };
        } else {
            if (genome_names.length > 0) {
                selected_genome = genome_names[0];
                var genome_data = genomes[selected_genome];
                gene_list = genome_data.gene_lists[0];
                model = genome_data.models[0];
            }
            this.state = {
                genome: selected_genome,
                gene_list: gene_list,
                model: model,
                all: false,
                upstream: 200,
                upstreamValid: true,
                downstream: 200,
                downStreamValid: true,
                maxPredictionSort: false,
                showCustomDialog: false,
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
        if (nextProps.genome_data) {
            var genomeName = Object.keys(nextProps.genome_data)[0];
            var newState = this.switchGenomeState(nextProps.genome_data, genomeName);
            if (this.state.genome == '') {
                this.setState(newState, this.runSearch);
            }
            else {
                this.setState(newState);
            }

        }
        if (nextProps.search_settings.genome) {
            var new_settings = nextProps.search_settings;
            this.setState(
                {
                    genome: new_settings.genome,
                    gene_list: new_settings.gene_list,
                    model: new_settings.model,
                    all: new_settings.all,
                    upstream: new_settings.upstream,
                    downstream: new_settings.downstream,
                    maxPredictionSort: new_settings.maxPredictionSort,
                    customListData: new_settings.customListData,
                });
        }
    }

    onChangeGenome(e) {
        var value = e.target.value;
        this.setState(this.switchGenomeState(this.props.genome_data, value), this.runSearch);
    }

    switchGenomeState(genomeData, genomeName) {
        return {
                genome: genomeName,
                gene_list: genomeData[genomeName]['gene_lists'][0],
                model: genomeData[genomeName]['models'][0],
        };
    }

    onChangeGeneList(e) {
        var value = e.target.value;
        var isCustom = value === CUSTOM_GENE_LIST || value === CUSTOM_RANGES_LIST;
        var func = this.runSearch;
        if (isCustom) {
            func = Function.prototype
        }
        this.setState({
            gene_list: e.target.value,
            showCustomDialog: isCustom,
        }, func);
    }

    setShowCustomDialog() {
        this.setState({
            showCustomDialog: true,
        });
    }

    closeCustomDialog(customListData) {
        var func = this.runSearch;
        this.setState({
            showCustomDialog: false,
            customListData: customListData,
        }, func);
    }

    onChangeModel(e) {
        this.setState({model: e.target.value}, this.runSearch);
    }

    getGenomeInfo(genomeName) {
        return this.props.genome_data[genomeName];
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
        var streamValue = new StreamValue(this.props.max_binding_offset);
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
        var assembly_options = [];
        var protein_options = [];
        var gene_list_options = [];
        var current_genome = this.state.genome;
        if (this.props.genome_data) {
            var genome_types = Object.keys(this.props.genome_data);
            for (var i = 0; i < genome_types.length; i++) {
                var name = genome_types[i];
                var genome_info = this.props.genome_data[name];
                assembly_options.push(<option key={name} value={name}>{name}</option>);
                if (name === current_genome) {
                    genome_info.models.forEach(function (model) {
                        protein_options.push(<option key={model}  value={model}>{model}</option>);
                    });
                    genome_info.gene_lists.forEach(function (gene_list) {
                        gene_list_options.push(<option key={gene_list}  value={gene_list}>{gene_list}</option>);
                    });
                }
            }
            gene_list_options.push(<option key="customGeneList"  value={CUSTOM_GENE_LIST}>{CUSTOM_GENE_LIST}</option>)
            gene_list_options.push(<option key="customRangeList"  value={CUSTOM_RANGES_LIST}>{CUSTOM_RANGES_LIST}</option>)
        }
        var geneListTitle = "Gene list:";
        var customListButton = [];
        if (this.state.gene_list == CUSTOM_GENE_LIST || this.state.gene_list == CUSTOM_RANGES_LIST) {
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
        if (this.state.gene_list == CUSTOM_RANGES_LIST) {
            disableUpstreamDownstream = true;
        }
        return <div>
                <h4>Filter</h4>
                <SelectItem title="Assembly:" selected={this.state.genome} options={assembly_options}
                            onChange={this.onChangeGenome}/>
                <SelectItem title="Protein/Model:" selected={this.state.model} options={protein_options}
                            onChange={this.onChangeModel}/>
                <SelectItem title={geneListTitle} selected={this.state.gene_list} options={gene_list_options}
                            onChange={this.onChangeGeneList}
                            />
                {customListButton}

                <StreamInput title="Bases upstream:" 
                             value={this.state.upstream} 
                             onChange={this.onChangeUpstream}
                             max_binding_offset={this.props.max_binding_offset}
                             isValid={this.state.upstreamValid}
                             disabled={disableUpstreamDownstream}
                              />
                <StreamInput title="Bases downstream:"
                             value={this.state.downstream} 
                             onChange={this.onChangeDownstream}
                             max_binding_offset={this.props.max_binding_offset}
                             isValid={this.state.downstreamValid}
                             disabled={disableUpstreamDownstream}
                             />
                <BooleanInput checked={this.state.maxPredictionSort} label="Sort by max value"
                              onChange={this.onChangeMaxPredictionSort} />
                <BooleanInput checked={this.state.all} label="Include all values"
                              onChange={this.onChangeAll} />
                <CustomListDialog type={this.state.gene_list}
                                  isOpen={this.state.showCustomDialog}
                                  onRequestClose={this.closeCustomDialog} />
        </div>
    }
}

export default GeneSearchPanel;
