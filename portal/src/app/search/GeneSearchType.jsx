import React from 'react';

const GENE_NAME_TYPE = 'gene_name';
const ID_TYPE = 'id';

class GeneSearchType extends React.Component {
    constructor(props) {
        super(props);
        this.setGeneNameType = this.setGeneNameType.bind(this);
        this.setIdType = this.setIdType.bind(this);
    }

    setGeneNameType() {
        this.props.setGeneSearchType(GENE_NAME_TYPE);
    }

    setIdType() {
        this.props.setGeneSearchType(ID_TYPE);
    }

    render() {
        return <div>
                    <label style={SEARCH_BY_SPAN}>Search by: </label>
                    <label>
                        <input type="radio" name="search_type" value="gene_name"
                               checked={this.props.geneSearchType === GENE_NAME_TYPE}
                               onChange={this.setGeneNameType}
                        />
                        <span style={RADIO_LABEL_SPAN}>Gene Name</span>
                    </label>
                    <label>
                        <input type="radio" name="search_type" value="id"
                               checked={this.props.geneSearchType === ID_TYPE}
                               onChange={this.setIdType}
                        />
                        <span style={RADIO_LABEL_SPAN}>ID</span>
                    </label>
            </div>;
    }
}

const SEARCH_BY_SPAN = {
    marginRight: '6px',
};

const RADIO_LABEL_SPAN = {
    marginLeft: '4px',
    marginRight: '10px',
};

export default GeneSearchType;