import React from 'react';
import Page from '../common/Page.jsx';
import {DATA_SOURCES_NAV} from '../models/Navigation.js';
import PageContent from '../common/PageContent.jsx';
import DataSource from './DataSource.jsx';
import DataSourceData from '../models/DataSourceData.js';

class DataSourcesPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            binding_predictions: [],
            preference_predictions: [],
            genelists: [],
            models: [],
            loading: true
        };
        this.dataSourceData = new DataSourceData();
    }

    componentDidMount() {
        this.dataSourceData.fetchData(this.onData, this.onError);
    }

    onData = (binding_predictions, preference_predictions, genelists, models) => {
        this.setState({
            binding_predictions: binding_predictions,
            preference_predictions: preference_predictions,
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
        let {binding_predictions, preference_predictions, genelists, models, loading} = this.state;
        return <Page nav_path={DATA_SOURCES_NAV.path} >
            <PageContent>
                <DataSource title="Binding Predictions" content={binding_predictions} loading={loading}/>
                <br />
                <DataSource title="Preference Predictions" content={preference_predictions} loading={loading}/>
                <br />
                <DataSource title="Gene Lists" content={genelists} loading={loading}/>
                <br />
                <DataSource title="Models" content={models} hasGroups={true} loading={loading}/>
            </PageContent>
        </Page>;
    }
}

export default DataSourcesPage;