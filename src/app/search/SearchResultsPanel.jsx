import React from 'react';
import Loader from 'react-loader';
import PageTitle from '../common/PageTitle.jsx'
import PagingButtons from './PagingButtons.jsx'
import GeneSearchPanel from './GeneSearchPanel.jsx'
import HeatMap from './HeatMap.jsx'
import ErrorPanel from './ErrorPanel.jsx'
import SearchSettings from '../store/SearchSettings.js'
import GenomeData from '../store/GenomeData.js'

class SearchResultsPanel extends React.Component {
    constructor(props) {
        super(props);
        this.downloadCsv = this.downloadCsv.bind(this);
        this.downloadTabDelimited = this.downloadTabDelimited.bind(this);
        this.search = this.search.bind(this);
        this.change_page = this.change_page.bind(this);
        this.scrollToTop = false;
    }

    componentWillUpdate() {
        if (this.scrollToTop) {
            var resultsGridContainer = document.getElementById('resultsGridContainer');
            resultsGridContainer.scrollTop = 0;
            this.scrollToTop = false;
        }
    }

    search(search_settings, page) {
        this.props.search(search_settings, page);
        this.scrollToTop = true;
    }

    change_page(page) {
        this.props.change_page(page);
        this.scrollToTop = true;
    }

    downloadCsv() {
        this.props.download_all('csv');
    }

    downloadTabDelimited() {
        this.props.download_all('tsv');
    }

    makeCellStyle(width, height, fontSize) {
        return {
            paddingLeft: '10px',
            display: 'inline-block',
            width: width,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: fontSize,
            height: height,
        };
    }

    render() {
        var search_settings = this.props.search_settings;
        var searchSettingsObj = new SearchSettings(this.props.search_settings);
        var genomeDataObj = new GenomeData(this.props.genome_data);
        var gridCellWidth = '12vw';
        if (search_settings.all === true) {
            gridCellWidth = '8vw';
        }
        var resultHeaderCell = {
            padding: '10px',
            display: 'inline-block',
            width: gridCellWidth,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            letterSpacing: '0.0625em',
        };
        var resultHeaderSmallCell = {
            padding: '10px',
            display: 'inline-block',
            width: '10vw',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            letterSpacing: '0.0625em',
        };
        var resultCell = {
            paddingLeft: '10px',
            display: 'inline-block',
            width: gridCellWidth,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '14px',
            height: '20px',
        };
        var resultSmallCell = {
            paddingLeft: '10px',
            display: 'inline-block',
            width: '10vw',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '14px',
            height: '20px',
        };
        var heatMapHeader = <span></span>;
        var cellExtraClassName = 'Wide';
        if (search_settings.all === true) {
            heatMapHeader = <span style={resultHeaderCell}>Values</span>
            cellExtraClassName = '';
        }
        var borderBottom = {
            borderBottom: '1px solid grey'
        }
        var smallPadding = { padding: '10px', width: '20vw' }
        var headerStyle = {
            backgroundColor: '#235f9c',
            color: 'white',
        };
        var parentStyle = {
            float: 'none',
            margin: '0 auto',
            width: '100%'

        }
        var tableStyle = {
            width: '100%',
        }
        var rowStyle = {
            borderBottom: '1px solid grey'
        };
        var queryResults = this.props.search_results;
        var rows = [];
        for (var i = 0; i < queryResults.length; i++) {
            var rowData = queryResults[i];
            var heatMap = <span></span>;
            if (search_settings.all === true) {
                var combined_name = rowData.common_name + " (" + rowData.name + ") ";
                var offsets_str = " upstream:" + search_settings.upstream + " downstream:" + search_settings.downstream;
                var trackHubUrl = genomeDataObj.getTrackHubUrl(searchSettingsObj.genome_version);
                var heatMapValues = {
                    title:  combined_name + " " + offsets_str,
                    values: rowData.values,
                    start: rowData.start,
                    end: rowData.end,
                    strand: rowData.strand,
                    upstream: search_settings.upstream,
                    downstream: search_settings.downstream,
                    chrom: rowData.chrom,
                    genome: this.props.search_settings.genome,
                    trackHubUrl: trackHubUrl,
                };
                heatMap = <HeatMap width="120" height="20"
                                   showDetailsOnClick={true}
                                   data={heatMapValues}
                                   scaleFactor={1.0}

                />
            }
            rows.push(<div key={i} style={borderBottom}>
                          <span className={"DataCell NameCell" + cellExtraClassName}>{rowData.common_name}</span>
                          <span className={"DataCell IdCell" + cellExtraClassName}>{rowData.name}</span>
                          <span className={"DataCell StrandCell" + cellExtraClassName}>{rowData.strand}</span>
                          <span className={"DataCell ChromCell" + cellExtraClassName}>{rowData.chrom}</span>
                          <span className="DataCell NumberCell">{rowData.start}</span>
                          <span className="DataCell NumberCell">{rowData.end}</span>
                          <span className="DataCell NumberCell">{rowData.max}</span>
                          <span >{heatMap}</span>
                        </div>);
        }
        var smallMargin = { margin: '10px' };

        var start_page = parseInt((this.props.page - 1)/ 5) * 5 + 1;
        var end_page = start_page + 4;

        var listContent = <Loader loaded={this.props.search_data_loaded} >
                {rows}
            </Loader>;
        if (this.props.errorMessage) {
            listContent = <ErrorPanel message={this.props.errorMessage} />;
        }
        return  <div className="container" style={parentStyle}>
                    <div className="row">

                        <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-2 col-col-md-10 col-sm-10" >
                            <PageTitle>TF Binding Predictions</PageTitle>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-2 col-sm-2 col-xs-2"  >
                                <GeneSearchPanel
                                        genome_data={this.props.genome_data}
                                        search={this.search}
                                        search_settings={this.props.search_settings}
                                        loaded={this.props.genome_data_loaded}
                                        max_binding_offset={this.props.max_binding_offset}
                                        setErrorMessage={this.props.setErrorMessage}
                                />
                        </div>
                        <div className="col-md-10 col-sm-10 col-xs-10" >
                            <div style={{backgroundColor: '#235f9c', color: 'white'}} >
                                  <span className={"HeaderCell NameCell" + cellExtraClassName}>Name</span>
                                  <span className={"HeaderCell IdCell" + cellExtraClassName}>ID</span>
                                  <span className={"HeaderCell StrandCell" + cellExtraClassName}>Strand</span>
                                  <span className={"HeaderCell ChromCell" + cellExtraClassName}>Chromosome</span>
                                  <span className="HeaderCell NumberCell">Start</span>
                                  <span className="HeaderCell NumberCell">End</span>
                                  <span className="HeaderCell NumberCell">Max</span>
                                  {heatMapHeader}
                            </div>
                            <div style={{overflowY: 'auto', height:'calc(100vh - 300px)'}} id="resultsGridContainer">
                                {listContent}
                            </div>
                            <nav>
                                <PagingButtons start_page={start_page} current_page={this.props.page} end_page={end_page}
                                               change_page={this.change_page}
                                               pageBatch={this.props.predictionStore.pageBatch}
                                />
                                &nbsp;
                                <div className="dropup" style={{display:'inline'}}>
                                      <button className="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1"
                                              data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"
                                              style={{verticalAlign:'top', margin:'20px'}}
                                      >
                                        Download

                                      </button>
                                      <ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
                                        <li><a href={this.props.download_all('tsv')} download>Tab Delimited</a></li>
                                        <li><a href={this.props.download_all('csv')} download>CSV Format</a></li>
                                      </ul>
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>
    }
}

export default SearchResultsPanel;