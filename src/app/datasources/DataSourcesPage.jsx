import React from 'react';
import NavBar from '../common/NavBar.jsx'
import ScrollingContainer from '../common/ScrollingContainer.jsx'
import DataSourceRow from './DataSourceRow.jsx'
import DataSourceList from './DataSourceList.jsx'
import DataSourceData from '../store/DataSourceData.js'

class DataSourcesPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            predictions: [],
            genelists: [],
        }
        this.onData = this.onData.bind(this);
        this.onError = this.onError.bind(this);
        this.dataSourceData = new DataSourceData();
    }

    componentDidMount() {
        this.dataSourceData.fetchData(this.onData, this.onError);
    }

    onData(predictions, genelists) {
        this.setState({
            predictions: predictions,
            genelists: genelists,
        });
    }

    onError(message) {
        alert(message);
    }

    makeRow(item) {
        return <DataSourceRow description={item.description}
                                     downloaded={item.downloaded}
                                     fullUrl={item.fullUrl}
                                     cleanUrl={item.cleanUrl} />
    }
    
    render() {
        var prediction_rows = this.state.predictions.map(makeRow);
        var gene_rows = this.state.genelists.map(makeRow);
        return <div>
            <NavBar selected="/datasources"/>
            <div className="std_left_right_margin std_bottom_margin">
                <ScrollingContainer height="80%">
                    <DataSourceList title="Predictions" content={prediction_rows}/>
                    <br />
                    <DataSourceList title="Gene Lists" content={gene_rows}/>

                </ScrollingContainer>
            </div>
        </div>;
    }
}

export default DataSourcesPage;