import React from 'react';

import PagingButtons from './PagingButtons.jsx'
import GeneSearchPanel from './GeneSearchPanel.jsx'

var HEAT_DATA = [{"value" : 0.263, "start" : 778454},
                 {"value" : 0.317, "start" : 778615},
                 {"value" : 0.286, "start" : 778640},
                 {"value" : 0.313, "start" : 778642},
                 {"value" : 0.335, "start" : 778690},
                 {"value" : 0.297, "start" : 778797}];
var heat_strand = '+';
var HEAT_HIGH = 778626;

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
        //var rows = [];
        var rows2 = [];
        for (var i = 0; i < queryResults.length; i++) {
            var rowData = queryResults[i];
            /*
            rows.push(<tr style={rowStyle}>
                          <td style={smallPadding}>{rowData.common_name}</td>
                          <td style={smallPadding}>{rowData.name}</td>
                          <td style={smallPadding}>{rowData.max}</td>
                          <td style={smallPadding}>{rowData.chrom}</td>
                          <td style={smallPadding}>{rowData.start}</td>
                          <td style={smallPadding}>{rowData.end}</td>
                        </tr>);
                        */
            var heatMapData = <span></span>;

            if (search_settings.all === true) {
                var heatMapWidth = 100;//(search_settings.upstream + search_settings.downstream) * 2;
                var heatMapHeight = 18;
                var rects = [];
                //aliceBlue = 240,248,255
                var min = Number.MAX_SAFE_INTEGER;
                var max = Number.MIN_SAFE_INTEGER;
                for (var j = 0; j < rowData.values.length; j++) {
                    var data = rowData.values[j];
                    min = Math.min(min, data.start);
                    max = Math.max(max, data.start);
                    var start = rowData.start - data.start + search_settings.upstream;
                    start = parseInt(start * 0.3);
                    //FIRST: 36593131
                    //HIGH:  36594591
                    var red = 255;
                    var green = 0;
                    var blue = 0;
                    var alpha = data.value;
                    var fill = "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
                    rects.push(
                    <g>
                        <title>{data.value} @ {data.start}</title>
                    <rect x={start} width={5} height={heatMapHeight} style={{fill:fill}}  />
                    </g>);
                }
                console.log('min:' + min);
                console.log('max:' + max);

                heatMapData = <svg width="200" height="18"  >
                                {rects}
                            </svg>

            }
            rows2.push(<div style={borderBottom}>

                          <span style={resultCell}>{rowData.common_name}</span>
                          <span style={resultCell}>{rowData.name}</span>
                          <span style={resultSmallCell}>{rowData.max}</span>
                          <span style={resultSmallCell}>{rowData.chrom}</span>
                          <span style={resultSmallCell}>{rowData.start}</span>
                          <span style={resultSmallCell}>{rowData.end}</span>
                          {heatMapData}
                        </div>);
        }
        var smallMargin = { margin: '10px' };

        var start_page = parseInt((this.props.page - 1)/ 5) * 5 + 1;
        var end_page = start_page + 4;
        return  <div className="container" style={parentStyle}>
                    <div className="row">

                        <div className="col-md-offset-2 col-md-10" >
                            <h3>TF Binding Predictions</h3>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-2"  >
                            <GeneSearchPanel
                                    genome_data={this.props.genome_data}
                                    search={this.search}
                                    search_settings={this.props.search_settings} />
                        </div>
                        <div className="col-md-10" >
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
                                {rows2}
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
                                        <li><a href="#" onClick={this.downloadTabDelimited}>Tab Delimited</a></li>
                                        <li><a href="#" onClick={this.downloadCsv}>CSV Format</a></li>
                                      </ul>
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>
    }
}

export default SearchResultsPanel;