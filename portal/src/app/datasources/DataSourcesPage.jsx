import React from 'react';
import NavBar from '../common/NavBar.jsx'
import {DATA_SOURCES_NAV} from '../models/Navigation.js'
import PageContent from '../common/PageContent.jsx'
import DataSource from './DataSource.jsx'
import DataSourceData from '../models/DataSourceData.js'

class DataSourcesPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            predictions: [],
            genelists: [],
            models: [],
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
            models: models
        });
    };

    onError = (message) => {
        alert(message);
    };

    render() {
        let {predictions, genelists, models} = this.state;
        return <div>
            <NavBar selected={DATA_SOURCES_NAV.path}/>
            <PageContent>
                <DataSource title="Predictions" content={predictions}/>
                <br />
                <DataSource title="Gene Lists" content={genelists}/>
                <br />
                <DataSource title="Models" content={models}/>
            </PageContent>
        </div>;
    }
}

export default DataSourcesPage;