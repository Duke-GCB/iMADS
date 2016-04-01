import React from 'react';
import NavBar from './NavBar.jsx'
import TableHeader from './table/TableHeader.jsx'
import TableCell from './table/TableCell.jsx'
import TableRow from './table/TableRow.jsx'

var DATA_SOURCE_INFO = [
    {'url': 'hgdownload.cse.ucsc.edu/goldenPath/hg19/database/knownGene.txt.gz',
     'description': 'UCSC hg19 knownGene.txt.gz',
     'downloaded': '2016-03-31 08:46'},
    {'url': 'hgdownload.cse.ucsc.edu/goldenPath/hg19/database/kgXref.txt.gz',
     'description': 'UCSC hg19 kgXref.txt.gz',
     'downloaded': '2016-03-31 08:46'},
    {'url': 'http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hg19/E2F1-hg19_binding_site.bb',
     'description': 'Prediction hg19 E2F1',
     'downloaded': '2016-03-31 08:47'},
    {'url': 'http://trackhub.genome.duke.edu/gordanlab/tf-dna-binding-predictions/hg19/E2F4-hg19_binding_site.bb',
     'description': 'Prediction hg19 E2F4',
     'downloaded': '2016-03-31 08:48'}];

class DataSources extends React.Component {
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
    create_rows(mediumWidth, largeWidth) {
        var data_sources = this.state.data_sources;
        var rows = [];
        for (var i = 0; i < data_sources.length; i++) {
            var data = data_sources[i];
            var cells = [];
            cells.push(<TableCell name={data.description} style={this.mediumWidth}></TableCell>);
            cells.push(<TableCell name={data.downloaded} style={this.smallWidth}></TableCell>);
            var full_url = data.url;
            if (!full_url.startsWith('http')) {
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
        var rows = this.create_rows();
        return  <div>
                    <NavBar selected="/datasources" />
                    <div className="std_left_right_margin std_bottom_margin">
                        <h3>Data Sources</h3>
                        <TableHeader>
                            <TableCell name="Description" style={this.mediumWidth} className="table_header_cell"/>
                            <TableCell name="Downloaded" style={this.smallWidth} className="table_header_cell"/>
                            <TableCell name="URL" style={this.largeWidth} className="table_header_cell"/>
                        </TableHeader>
                        <div>
                            {rows}
                        </div>
                    </div>
                </div>;
    }
}

export default DataSources;