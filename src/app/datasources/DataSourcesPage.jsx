import React from 'react';
import NavBar from '../common/NavBar.jsx'
import ScrollingContainer from '../common/ScrollingContainer.jsx'
import DataSourceRow from './DataSourceRow.jsx'
import DataSourceList from './DataSourceList.jsx'

class DataSourcesPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data_sources: [],
        }
    }

    componentDidMount() {
        console.log('fetching datasources data');
        $.ajax({
            url: '/api/v1/datasources',
            dataType: 'json',
            type: 'GET',
            cache: false,
            success: function (data) {
                console.log('got genome data');
                this.setState({
                    data_sources: data.results,
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.log('error fetching datasources data');
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    }

    create_rows(data_source_type) {
        var data_sources = this.state.data_sources;
        var rows = [];
        for (var i = 0; i < data_sources.length; i++) {
            var data = data_sources[i];
            if (data.data_source_type !== data_source_type) {
                continue;
            }
            var full_url = data.url;
            if (full_url.indexOf('http') === 0) {
                full_url = 'http://' + full_url;
            }
            var clean_url = data.url.replace("https:\/\/", "").replace("http:\/\/", "");
            rows.push(<DataSourceRow description={data.description}
                                     downloaded={data.downloaded}
                                     fullUrl={full_url}
                                     cleanUrl={clean_url}
            />)
        }
        return rows;
    }

    render() {
        var prediction_rows = this.create_rows('prediction');
        var gene_rows = this.create_rows('genelist');
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