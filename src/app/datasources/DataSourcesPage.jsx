import React from 'react';
import NavBar from '../common/NavBar.jsx'
import PageTitle from '../common/PageTitle.jsx'
import ScrollingContainer from '../common/ScrollingContainer.jsx'
import TableHeader from '../common/TableHeader.jsx'
import TableCell from '../common/TableCell.jsx'
import TableRow from '../common/TableRow.jsx'

class DataSourcesPage extends React.Component {
    constructor(props) {
        super(props);
        this.smallWidth = {width:'14vw'};
        this.mediumWidth = {width:'20vw'};
        this.largeWidth = {width:'30vw'};
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
          success: function(data) {
              console.log('got genome data');
            this.setState({
                data_sources: data.results,
            });
          }.bind(this),
          error: function(xhr, status, err) {
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
            var cells = [];
            cells.push(<TableCell name={data.description} style={this.mediumWidth}></TableCell>);
            cells.push(<TableCell name={data.downloaded} style={this.smallWidth}></TableCell>);
            var full_url = data.url;
            if (full_url.indexOf('http') === 0) {
                full_url = 'http://' + full_url;
            }
            var clean_url = data.url.replace("https:\/\/","").replace("http:\/\/","");
            var nameLink = <a href={full_url}>{clean_url}</a>;
            cells.push(<TableCell name={nameLink} style={this.largeWidth}></TableCell>);
            rows.push(<TableRow>{cells}</TableRow>)
        }
        return rows;
    }

    render() {
        var prediction_rows = this.create_rows('prediction');
        var gene_rows = this.create_rows('genelist');
        return  <div>
                    <NavBar selected="/datasources" />
                    <div className="std_left_right_margin std_bottom_margin">
                        <ScrollingContainer height="80%">
                        <PageTitle>Predictions</PageTitle>
                        <TableHeader>
                            <TableCell name="Description" style={this.mediumWidth} className="table_header_cell"/>
                            <TableCell name="Downloaded" style={this.smallWidth} className="table_header_cell"/>
                            <TableCell name="URL" style={this.largeWidth} className="table_header_cell"/>
                        </TableHeader>
                        {prediction_rows}

                        <br />
                        <PageTitle>Gene Lists</PageTitle>
                        <TableHeader>
                            <TableCell name="Description" style={this.mediumWidth} className="table_header_cell"/>
                            <TableCell name="Downloaded" style={this.smallWidth} className="table_header_cell"/>
                            <TableCell name="URL" style={this.largeWidth} className="table_header_cell"/>
                        </TableHeader>

                        {gene_rows}
                        </ScrollingContainer>
                    </div>
                </div>;
    }
}

export default DataSourcesPage;