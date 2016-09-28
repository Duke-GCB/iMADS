import React from 'react';
require('./GeneSearchType.css');

const GENE_NAME_TYPE = 'gene_name';
const ID_TYPE = 'id';

class GeneSearchType extends React.Component {
    constructor(props) {
        super(props);
    }

    setGeneNameType = () => {
        this.props.setGeneSearchType(GENE_NAME_TYPE);
    };

    setIdType = () => {
        this.props.setGeneSearchType(ID_TYPE);
    };

    render() {
        return <div>
                    <label className="GeneSearchByType_search_by_label">Search by: </label>
                    <label>
                        <input type="radio" name="search_type" value="gene_name"
                               checked={this.props.geneSearchType === GENE_NAME_TYPE}
                               onChange={this.setGeneNameType}
                        />
                        <span className="GeneSearchByType_general_label">Gene Name</span>
                    </label>
                    <label>
                        <input type="radio" name="search_type" value="id"
                               checked={this.props.geneSearchType === ID_TYPE}
                               onChange={this.setIdType}
                        />
                        <span  className="GeneSearchByType_general_label">ID</span>
                    </label>
            </div>;
    }
}

export default GeneSearchType;