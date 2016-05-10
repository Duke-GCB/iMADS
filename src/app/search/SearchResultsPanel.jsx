import React from 'react';
import Loader from 'react-loader';
import PagingButtons from './PagingButtons.jsx'
import PredictionDialog from './PredictionDialog.jsx'
import HeatMap from './HeatMap.jsx'
import ErrorPanel from './ErrorPanel.jsx'
import ListHeader from '../common/ListHeader.jsx'
import GetLinkDialog from './GetLinkDialog.jsx'
import GenomeData from '../store/GenomeData.js'
import {CUSTOM_RANGES_LIST} from '../store/CustomList.js'

class SearchResultsPanel extends React.Component {
    constructor(props) {
        super(props);
        this.downloadCsv = this.downloadCsv.bind(this);
        this.downloadTabDelimited = this.downloadTabDelimited.bind(this);
        this.changePage = this.changePage.bind(this);
        this.showGetLinkDialog = this.showGetLinkDialog.bind(this);
        this.hideGetLinkDialog = this.hideGetLinkDialog.bind(this);
        this.showPredictionDetails = this.showPredictionDetails.bind(this);
        this.hidePredictionDetails = this.hidePredictionDetails.bind(this);
        this.state = {
            showGetUrlDialog: false,
            predictionData: undefined,
        }
    }

    searchOperations() {
        return this.props.searchOperations;
    }

    componentWillUpdate() {
        if (this.scrollToTop) {
            let resultsGridContainer = document.getElementById('resultsGridContainer');
            resultsGridContainer.scrollTop = 0;
            this.scrollToTop = false;
        }
    }

    changePage(page){
        this.searchOperations().changePage(page);
        this.scrollToTop = true;
    }

    downloadCsv() {
        return this.searchOperations().downloadAll('csv');
    }

    downloadTabDelimited() {
        return this.searchOperations().downloadAll('tsv');
    }

    showGetLinkDialog() {
        this.setState({
            showGetUrlDialog: true
        });
    }

    hideGetLinkDialog() {
        this.setState({
            showGetUrlDialog: false,
            shareUrl: ''
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
        let searchSettings = this.props.searchSettings;
        let genomeDataObj = new GenomeData(this.props.genomeData);
        let gridCellWidth = '12vw';
        if (searchSettings.all === true) {
            gridCellWidth = '8vw';
        }
        let resultHeaderCell = {
            padding: '10px',
            display: 'inline-block',
            width: gridCellWidth,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            letterSpacing: '0.0625em',
        };
        let resultHeaderSmallCell = {
            padding: '10px',
            display: 'inline-block',
            width: '10vw',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            letterSpacing: '0.0625em',
        };
        let resultCell = {
            paddingLeft: '10px',
            display: 'inline-block',
            width: gridCellWidth,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '14px',
            height: '20px',
        };
        let resultSmallCell = {
            paddingLeft: '10px',
            display: 'inline-block',
            width: '10vw',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontFamily: 'Roboto, sans-serif',
            fontSize: '14px',
            height: '20px',
        };
        let heatMapHeader = <span></span>;
        let cellExtraClassName = 'Wide';
        if (searchSettings.all === true) {
            heatMapHeader = <span style={resultHeaderCell}>Values</span>
            cellExtraClassName = '';
        }
        let borderBottom = {
            borderBottom: '1px solid grey'
        }
        let smallPadding = { padding: '10px', width: '20vw' }
        let isCustomRange = searchSettings.geneList == CUSTOM_RANGES_LIST;
        let queryResults = this.props.searchResults;
        let rows = [];
        for (let i = 0; i < queryResults.length; i++) {
            let rowData = queryResults[i];
            let heatMap = <span></span>;
            if (searchSettings.all === true) {
                let combinedName = rowData.commonName + " (" + rowData.name + ") ";
                let offsetsStr = " upstream:" + searchSettings.upstream + " downstream:" + searchSettings.downstream;
                let trackHubUrl = genomeDataObj.getTrackHubUrl(searchSettings.genome);
                let title = combinedName + " " + offsetsStr;
                if (isCustomRange) {
                    title = rowData.chrom + ":" + rowData.start + "-" + rowData.end;
                }
                let heatMapValues = {
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
        let columnHeaders;
        if (isCustomRange) {
            columnHeaders = <ListHeader>
                                  <span className={"HeaderCell IdCellWide"}>Name</span>
                                  <span className="HeaderCell NumberCell">Max</span>
                                  {heatMapHeader}
                            </ListHeader>
        } else {
            columnHeaders = <ListHeader >
                                  <span className={"HeaderCell NameCell" + cellExtraClassName}>Name</span>
                                  <span className={"HeaderCell IdCell" + cellExtraClassName}>ID</span>
                                  <span className={"HeaderCell StrandCell" + cellExtraClassName}>Strand</span>
                                  <span className={"HeaderCell ChromCell" + cellExtraClassName}>Chromosome</span>
                                  <span className="HeaderCell NumberCell">Start</span>
                                  <span className="HeaderCell NumberCell">End</span>
                                  <span className="HeaderCell NumberCell">Max</span>
                                  {heatMapHeader}
                            </ListHeader>
        }
        let smallMargin = { margin: '10px' };

        let startPage = parseInt((this.props.page - 1)/ 5) * 5 + 1;
        let endPage = startPage + 4;
        let listContent = <Loader loaded={this.props.searchDataLoaded} >
                {rows}
            </Loader>;
        if (this.props.errorMessage) {
            listContent = <ErrorPanel message={this.props.errorMessage} />;
        }
        let showPredictionDetails = false;
        if (this.state.predictionData) {
            showPredictionDetails = true;
        }
        let footer = [];
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
                            <li><a href={this.downloadTabDelimited()} download>Tab Delimited</a></li>
                            <li><a href={this.downloadCsv()} download>CSV Format</a></li>
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
        return  <div>
                    {columnHeaders}
                    <div id="resultsGridContainer" className="SearchResultsPanel__resultsGridContainer">
                        {listContent}
                    </div>
                    {footer}
                    <PredictionDialog isOpen={showPredictionDetails}
                              onRequestClose={this.hidePredictionDetails}
                              data={this.state.predictionData}/>
        </div>
    }
}

export default SearchResultsPanel;
