import React from 'react';

import NavMenuButton from './NavMenuButton.jsx'

const HEADER_LABEL = '';

class SelectItem extends React.Component {
    render() {
        return <div>
                    <label>{this.props.title}:</label>
                        <select className="form-control" value={this.props.selected} onChange={this.props.onChange}>
                            {this.props.options}
                        </select>
                </div>
    }
}



class StreamInput extends React.Component {
    render() {
        return <div>
                    <label>{this.props.title}
                        <input type="text" className="form-control"
                               defaultValue={this.props.value}
                               onBlur={this.props.onChange}
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
                           checked={this.checked} onChange={this.onChange}
                    /> {this.props.label}
            </label>
    }
}

class GeneSearchPanel extends React.Component {
    constructor(props) {
        super(props);
        var genomes = this.props.genome_data;
        var selected_genome = '';
        var gene_list = [];
        var models = [];
        var genome_names = Object.keys(genomes);
        if (this.props.search_settings.genome) {
            var new_settings = this.props.search_settings;
            this.state = {
                    genome: new_settings.genome,
                    gene_list: new_settings.gene_list,
                    model: new_settings.model,
                    all: new_settings.all,
                    upstream: new_settings.upstream,
                    downstream: new_settings.downstream,
                    maxPredictionSort: new_settings.maxPredictionSort,
                };
        } else {
            if (genome_names.length > 0) {
                selected_genome = genome_names[0];
                var genome_data = genomes[selected_genome];
                gene_list = genome_data.gene_lists[0];
                models = genome_data.models[0];
            }
            this.state = {
                genome: selected_genome,
                gene_list: gene_list,
                model: models,
                all: false,
                upstream: 200,
                downstream: 200,
                maxPredictionSort: false,
            };
        }
        this.onChangeGenome = this.onChangeGenome.bind(this);
        this.onChangeModel = this.onChangeModel.bind(this);
        this.onChangeGeneList = this.onChangeGeneList.bind(this);
        this.onChangeAll = this.onChangeAll.bind(this);
        this.onChangeUpstream = this.onChangeUpstream.bind(this);
        this.onChangeDownstream = this.onChangeDownstream.bind(this);
        this.onChangeMaxPredictionSort = this.onChangeMaxPredictionSort.bind(this);
        this.onClickSearch = this.onClickSearch.bind(this);
        this.onClickClearInput = this.onClickClearInput.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.genome_data) {
            var genomeName = Object.keys(nextProps.genome_data)[0];
            var newState = this.switchGenomeState(nextProps.genome_data, genomeName);
            if (this.state.genome == '') {
                this.setState(newState, this.onClickSearch);
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
                });
        }
    }

    onChangeGenome(e) {
        var value = e.target.value;
        this.setState(this.switchGenomeState(this.props.genome_data, value), this.onClickSearch);
    }

    switchGenomeState(genomeData, genomeName) {
        return {
                genome: genomeName,
                gene_list: genomeData[genomeName]['gene_lists'][0],
                model: genomeData[genomeName]['models'][0],
        };
    }

    onChangeGeneList(e) {
        this.setState({gene_list: e.target.value}, this.onClickSearch);
    }

    onChangeModel(e) {
        this.setState({model: e.target.value}, this.onClickSearch);
    }

    getGenomeInfo(genomeName) {
        return this.props.genome_data[genomeName];
    }

    onChangeAll(value) {
        this.setState({all: value}, this.onClickSearch);
    }

    onChangeUpstream(e) {
        var value = this.parseStreamValue(e.target.value);
        if (value) {
            this.setState({upstream: value}, this.onClickSearch);
        }
    }

    onChangeDownstream(e) {
        var value = this.parseStreamValue(e.target.value);
        if (value) {
            this.setState({downstream: value}, this.onClickSearch);
        }
    }

    parseStreamValue(strValue) {
        var value = parseInt(strValue);
        if (isNaN(value)) {
            return undefined;
        } else {
            return value;
        }
    }

    onChangeMaxPredictionSort(value) {
        this.setState({maxPredictionSort: value}, this.onClickSearch);
    }

    onClickSearch() {
        this.props.search(this.state, 1);
    }

    onClickClearInput() {
        console.log("Clear Input!")
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
                assembly_options.push(<option value={name}>{name}</option>);
                if (name === current_genome) {
                    genome_info.models.forEach(function (model) {
                        protein_options.push(<option value={model}>{model}</option>);
                    });
                    genome_info.gene_lists.forEach(function (gene_list) {
                        gene_list_options.push(<option value={gene_list}>{gene_list}</option>);
                    });
                }
            }
        }
        return <div>
                <h4>Filter</h4>
                <SelectItem title="Assembly" selected={this.state.genome} options={assembly_options}
                            onChange={this.onChangeGenome}/>

                <SelectItem title="Protein" selected={this.state.model} options={protein_options}
                            onChange={this.onChangeModel}/>

                <SelectItem title="Gene list" selected={this.state.gene_list} options={gene_list_options}
                            onChange={this.onChangeGeneList}/>
                <StreamInput title="Bases upstream:" value={this.state.upstream} onChange={this.onChangeUpstream}/>
                <StreamInput title="Bases downstream:" value={this.state.downstream} onChange={this.onChangeDownstream}/>
                <BooleanInput checked={this.state.maxPredictionSort} label="Sort by max value"
                              onChange={this.onChangeMaxPredictionSort} />
                <BooleanInput checked={this.state.all} label="Include all values" onChange={this.onChangeAll} />
        </div>
    }
}

export default GeneSearchPanel;