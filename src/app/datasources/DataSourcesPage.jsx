import React from 'react';
import NavBar from '../common/NavBar.jsx'
import {DATA_SOURCES_NAV} from '../store/Navigation.js'
import PageContent from '../common/PageContent.jsx'
import DataSource from './DataSource.jsx'
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

    render() {
        let {predictions, genelists} = this.state;
        return <div>
            <NavBar selected={DATA_SOURCES_NAV.path}/>
            <PageContent>
                <DataSource title="Predictions" content={predictions}/>
                <br />
                <DataSource title="Gene Lists" content={genelists}/>
            </PageContent>
        </div>;
    }
}

export default DataSourcesPage;