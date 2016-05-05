import React from 'react';
import Loader from 'react-loader';
import PageTitle from '../common/PageTitle.jsx'
import PagingButtons from './PagingButtons.jsx'
import PredictionDialog from './PredictionDialog.jsx'
import GeneSearchPanel from './GeneSearchPanel.jsx'
import HeatMap from './HeatMap.jsx'
import ErrorPanel from './ErrorPanel.jsx'
import GetLinkDialog from './GetLinkDialog.jsx'
import SearchSettings from '../store/SearchSettings.js'
import GenomeData from '../store/GenomeData.js'
import {CUSTOM_RANGES_LIST} from '../store/CustomList.js'

class SearchResultsPanel extends React.Component {
    constructor(props) {
        super(props);
        this.downloadCsv = this.downloadCsv.bind(this);
        this.downloadTabDelimited = this.downloadTabDelimited.bind(this);
        this.search = this.search.bind(this);
        this.changePage = this.changePage.bind(this);
        this.showGetLinkDialog = this.showGetLinkDialog.bind(this);
        this.hideGetLinkDialog = this.hideGetLinkDialog.bind(this);
        this.showPredictionDetails = this.showPredictionDetails.bind(this);
        this.hidePredictionDetails = this.hidePredictionDetails.bind(this);
        this.scrollToTop = false;
        this.state = {
            showGetUrlDialog: false,
            predictionData: undefined,
        }
    }

    componentWillUpdate() {
        if (this.scrollToTop) {
            var resultsGridContainer = document.getElementById('resultsGridContainer');
            resultsGridContainer.scrollTop = 0;
            this.scrollToTop = false;
        }
    }

    search(searchSettings, page) {
        this.props.search(searchSettings, page);
        this.scrollToTop = true;
    }

    changePage(page) {
        this.props.changePage(page);
        this.scrollToTop = true;
    }

    downloadCsv() {
        this.props.downloadAll('csv');
    }

    downloadTabDelimited() {
        this.props.downloadAll('tsv');
    }

    showGetLinkDialog() {
        this.setState({
            showGetUrlDialog: true,
        });
    }

    hideGetLinkDialog() {
        this.setState({
            showGetUrlDialog: false,
            shareUrl: '',
        });
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

    showPredictionDetails(predictionData) {
        this.setState({
            predictionData: predictionData,
        })
    }

    hidePredictionDetails(predictionData) {
        this.setState({
            predictionData: undefined,
        })
    }

    render() {
        var searchSettings = this.props.searchSettings;
        var searchSettingsObj = new SearchSettings(this.props.searchSettings);
        var genomeDataObj = new GenomeData(this.props.genomeData);
        var gridCellWidth = '12vw';
        if (searchSettings.all === true) {
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
        if (searchSettings.all === true) {
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
        var isCustomRange = searchSettings.geneList == CUSTOM_RANGES_LIST;
        var queryResults = this.props.searchResults;
        var rows = [];
        for (var i = 0; i < queryResults.length; i++) {
            var rowData = queryResults[i];
            var heatMap = <span></span>;
            if (searchSettings.all === true) {
                var combinedName = rowData.commonName + " (" + rowData.name + ") ";
                var offsetsStr = " upstream:" + searchSettings.upstream + " downstream:" + searchSettings.downstream;
                var trackHubUrl = genomeDataObj.getTrackHubUrl(searchSettingsObj.genomeVersion);
                var title = combinedName + " " + offsetsStr;
                if (isCustomRange) {
                    title = rowData.chrom + ":" + rowData.start + "-" + rowData.end;
                }
                var heatMapValues = {
                    title:  title,
                    values: rowData.values,
                    start: rowData.start,
                    end: rowData.end,
                    strand: rowData.strand,
                    upstream: searchSettings.upstream,
                    downstream: searchSettings.downstream,
                    chrom: rowData.chrom,
                    genome: this.props.searchSettings.genome,
                    trackHubUrl: trackHubUrl,
                    isCustomRange: isCustomRange,
                };
                heatMap = <HeatMap width="120" height="20"
                                   onClickHeatmap={this.showPredictionDetails}
                                   data={heatMapValues}
                                   scaleFactor={1.0}
                />
            }
            if (isCustomRange) {
                rows.push(<div key={i} style={borderBottom}>
                    <span className={"DataCell IdCellWide"}>
                        {rowData.chrom}:{rowData.start}-{rowData.end}
                    </span>
                    <span className="DataCell NumberCell">{rowData.max}</span>
                    <span >{heatMap}</span>
                </div>);
            } else {
                rows.push(<div key={i} style={borderBottom}>
                    <span className={"DataCell NameCell" + cellExtraClassName}>{rowData.commonName}</span>
                    <span className={"DataCell IdCell" + cellExtraClassName}>{rowData.name}</span>
                    <span className={"DataCell StrandCell" + cellExtraClassName}>{rowData.strand}</span>
                    <span className={"DataCell ChromCell" + cellExtraClassName}>{rowData.chrom}</span>
                    <span className="DataCell NumberCell">{rowData.start}</span>
                    <span className="DataCell NumberCell">{rowData.end}</span>
                    <span className="DataCell NumberCell">{rowData.max}</span>
                    <span >{heatMap}</span>
                </div>);
            }
        }
        var columnHeaders;
        if (isCustomRange) {
            columnHeaders = <div style={{backgroundColor: '#235f9c', color: 'white'}} >
                                  <span className={"HeaderCell IdCellWide"}>Name</span>
                                  <span className="HeaderCell NumberCell">Max</span>
                                  {heatMapHeader}
                            </div>
        } else {
            columnHeaders = <div style={{backgroundColor: '#235f9c', color: 'white'}} >
                                  <span className={"HeaderCell NameCell" + cellExtraClassName}>Name</span>
                                  <span className={"HeaderCell IdCell" + cellExtraClassName}>ID</span>
                                  <span className={"HeaderCell StrandCell" + cellExtraClassName}>Strand</span>
                                  <span className={"HeaderCell ChromCell" + cellExtraClassName}>Chromosome</span>
                                  <span className="HeaderCell NumberCell">Start</span>
                                  <span className="HeaderCell NumberCell">End</span>
                                  <span className="HeaderCell NumberCell">Max</span>
                                  {heatMapHeader}
                            </div>
        }
        var smallMargin = { margin: '10px' };

        var startPage = parseInt((this.props.page - 1)/ 5) * 5 + 1;
        var endPage = startPage + 4;
        var listContent = <Loader loaded={this.props.searchDataLoaded} >
                {rows}
            </Loader>;
        if (this.props.errorMessage) {
            listContent = <ErrorPanel message={this.props.errorMessage} />;
        }
        var showPredictionDetails = false;
        if (this.state.predictionData) {
            showPredictionDetails = true;
        }
        var footer = [];
        if (this.props.searchDataLoaded) {
            if (queryResults.length > 0) {
                footer = <nav>
                    <PagingButtons startPage={startPage} currentPage={this.props.page} endPage={endPage}
                                   changePage={this.changePage}
                                   pageBatch={this.props.predictionStore.pageBatch}
                    />
                    &nbsp;
                    <div className="dropup" style={{display:'inline'}}>
                        <button className="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1"
                                data-toggle="dropdown" aria-haspopup="true" aria-expanded="true"
                                style={{verticalAlign:'top', marginLeft:'20px', marginTop:'20px'}}
                        >
                            Download All Data

                        </button>
                        <ul className="dropdown-menu" aria-labelledby="dropdownMenu1">
                            <li><a href={this.props.downloadAll('tsv')} download>Tab Delimited</a></li>
                            <li><a href={this.props.downloadAll('csv')} download>CSV Format</a></li>
                        </ul>
                    </div>
                        <button className="btn btn-default" type="button"
                                style={{verticalAlign:'top', marginLeft:'20px', marginTop:'20px'}}
                                onClick={this.showGetLinkDialog}
                        >
                            Share
                        </button>
                        <GetLinkDialog isOpen={this.state.showGetUrlDialog}
                                       searchSettings={this.props.searchSettings}
                                       closeDialog={this.hideGetLinkDialog} />
                </nav>
            } else {
                if (!this.props.errorMessage) {
                    listContent = <div className="centerChildrenHorizontally">
                        <span className="SearchResultsPanel__no_results_found centerVertically">No results found.</span>
                    </div>
                }
            }
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
                                        genomeData={this.props.genomeData}
                                        search={this.search}
                                        searchSettings={this.props.searchSettings}
                                        loaded={this.props.genomeDataLoaded}
                                        maxBindingOffset={this.props.maxBindingOffset}
                                        setErrorMessage={this.props.setErrorMessage}
                                        showCustomDialog={this.props.showCustomDialog}
                                />
                        </div>
                        <div className="col-md-10 col-sm-10 col-xs-10" >
                            {columnHeaders}
                            <div id="resultsGridContainer" className="SearchResultsPanel__resultsGridContainer">
                                {listContent}
                            </div>
                            {footer}
                        </div>
                    </div>
                    <PredictionDialog isOpen={showPredictionDetails}
                                      onRequestClose={this.hidePredictionDetails}
                                      data={this.state.predictionData}/>
                </div>
    }
}

export default SearchResultsPanel;
