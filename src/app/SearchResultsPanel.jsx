import React from 'react';
import Loader from 'react-loader';

import PagingButtons from './PagingButtons.jsx'
import GeneSearchPanel from './GeneSearchPanel.jsx'

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

    render() {
        var search_settings = this.props.search_settings;
        var gridCellWidth = '16vw';
        if (search_settings.all === true) {
            gridCellWidth = '12vw';
        }
        var resultHeaderCell = {
            padding: '10px',
            display: 'inline-block',
            width: gridCellWidth,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '20px',
            letterSpacing: '0.0625em',
        };
        var resultHeaderSmallCell = {
            padding: '10px',
            display: 'inline-block',
            width: '10vw',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '20px',
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
        if (search_settings.all === true) {
            heatMapHeader = <span style={resultHeaderCell}>Values</span>
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
            var heatMapData = <span></span>;

            if (search_settings.all === true) {
                var heatMapWidth = 100;
                var heatMapHeight = 18;
                var rects = [];
                var min = Number.MAX_SAFE_INTEGER;
                var max = Number.MIN_SAFE_INTEGER;
                var SCALING_AMT = 0.3;
                for (var j = 0; j < rowData.values.length; j++) {
                    var data = rowData.values[j];
                    min = Math.min(min, data.start);
                    max = Math.max(max, data.start);
                    var start = rowData.start - data.start + search_settings.upstream;

                    start = parseInt(start * SCALING_AMT);
                    var red = 255;
                    var green = 0;
                    var blue = 0;
                    var alpha = data.value;
                    var fill = "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
                    rects.push(
                    <g>
                        <title>{data.value} @ {data.start}</title>
                    <rect x={start} width={3} height={heatMapHeight} style={{fill:fill}}  />
                    </g>);
                }
                heatMapData = <svg width="200" height="18"  >
                                {rects}
                            </svg>
            }
            rows.push(<div key={i} style={borderBottom}>

                          <span style={resultCell}>{rowData.common_name}</span>
                          <span style={resultCell}>{rowData.name}</span>
                          <span style={resultSmallCell}>{rowData.max}</span>
                          <span style={resultSmallCell}>{rowData.chrom}</span>
                          <span style={resultSmallCell}>{rowData.start}</span>
                          <span style={resultSmallCell}>{rowData.end}</span>
                          <span style={resultSmallCell}>{heatMapData}</span>
                        </div>);
        }
        var smallMargin = { margin: '10px' };

        var start_page = parseInt((this.props.page - 1)/ 5) * 5 + 1;
        var end_page = start_page + 4;
        return  <div className="container" style={parentStyle}>
                    <div className="row">

                        <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-2 col-col-md-10 col-sm-10" >
                            <h3>TF Binding Predictions</h3>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-2 col-sm-2 col-xs-2"  >

                                <GeneSearchPanel
                                        genome_data={this.props.genome_data}
                                        search={this.search}
                                        search_settings={this.props.search_settings}
                                        loaded={this.props.genome_data_loaded}
                                />

                        </div>
                        <div className="col-md-10 col-sm-10 col-xs-10" >
                            <div style={{backgroundColor: '#235f9c', color: 'white'}} >
                                  <span style={resultHeaderCell}>Name</span>
                                  <span style={resultHeaderCell}>ID</span>
                                  <span style={resultHeaderSmallCell}>Max</span>
                                  <span style={resultHeaderSmallCell}>Location</span>
                                  <span style={resultHeaderSmallCell}>Start</span>
                                  <span style={resultHeaderSmallCell}>End</span>
                                  {heatMapHeader}
                            </div>
                            <div style={{overflowY: 'auto', height:'calc(100vh - 300px)'}} id="resultsGridContainer">
                                <Loader loaded={this.props.search_data_loaded} >
                                    {rows}
                                </Loader>
                            </div>
                            <nav>
                                <PagingButtons start_page={start_page} current_page={this.props.page} end_page={end_page}
                                               change_page={this.change_page}
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