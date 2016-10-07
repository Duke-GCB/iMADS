import React from 'react';
import NavBar from '../common/NavBar.jsx';
import {DATA_SOURCES_NAV} from '../models/Navigation.js';
import PageContent from '../common/PageContent.jsx';
import DataSource from './DataSource.jsx';
import DataSourceData from '../models/DataSourceData.js';

class DataSourcesPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            predictions: [],
            genelists: [],
            models: [],
            loading: true
        };
        this.dataSourceData = new DataSourceData();
    }

    componentDidMount() {
        this.dataSourceData.fetchData(this.onData, this.onError);
    }

    onData = (predictions, genelists, models) => {
        this.setState({
            predictions: predictions,
            genelists: genelists,
            models: models,
            loading: false
        });
    };

    onError = (message) => {
        alert(message);
        this.setState({
            predictions: [],
            genelists: [],
            models: [],
            loading: false
        });
    };

    render() {
        let {predictions, genelists, models, loading} = this.state;
        return <div>
            <NavBar selected={DATA_SOURCES_NAV.path}/>
            <PageContent>
                <DataSource title="Predictions" content={predictions} loading={loading}/>
                <br />
                <DataSource title="Gene Lists" content={genelists} loading={loading}/>
                <br />
                <DataSource title="Models" content={models} hasGroups={true} loading={loading}/>
            </PageContent>
        </div>;
    }
}

export default DataSourcesPage;