import React from 'react';
import Loader from 'react-loader';

import PredictionDialog from './PredictionDialog.jsx'
import HeatMap from './HeatMap.jsx'
import ErrorPanel from './ErrorPanel.jsx'

import GenomeData from '../store/GenomeData.js'
import {CUSTOM_RANGES_LIST} from '../store/CustomList.js'
import {ResultHeaderRow, ResultDetailRow} from './ResultRow.jsx'
import SearchResultsFooter from './SearchResultsFooter.jsx'

class SearchResultsPanel extends React.Component {
    constructor(props) {
        super(props);
        this.showPredictionDetails = this.showPredictionDetails.bind(this);
        this.hidePredictionDetails = this.hidePredictionDetails.bind(this);
        this.state = {
            predictionData: undefined,
        }
    }

    componentWillUpdate() {
        /*
         if (this.scrollToTop) {
         let resultsGridContainer = document.getElementById('resultsGridContainer');
         resultsGridContainer.scrollTop = 0;
         this.scrollToTop = false;
         }*/
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

    makeHeatMap(rowData) {
        let searchSettings = this.props.searchSettings;
        let rangeType = searchSettings.geneList === CUSTOM_RANGES_LIST;
        let heatMap = <span></span>;
        if (searchSettings.all === true) {
            let combinedName = rowData.commonName + " (" + rowData.name + ") ";
            let offsetsStr = " upstream:" + searchSettings.upstream + " downstream:" + searchSettings.downstream;
            let genomeDataObj = new GenomeData(this.props.genomeData);
            let trackHubUrl = genomeDataObj.getTrackHubUrl(searchSettings.genome);
            let title = combinedName + " " + offsetsStr;
            if (rangeType) {
                title = rowData.chrom + ":" + rowData.start + "-" + rowData.end;
            }
            let heatMapValues = {
                title: title,
                values: rowData.values,
                start: rowData.start,
                end: rowData.end,
                strand: rowData.strand,
                upstream: searchSettings.upstream,
                downstream: searchSettings.downstream,
                chrom: rowData.chrom,
                genome: this.props.searchSettings.genome,
                trackHubUrl: trackHubUrl,
                isCustomRange: rangeType,
            };
            heatMap = <HeatMap width="120" height="20"
                               onClickHeatmap={this.showPredictionDetails}
                               data={heatMapValues}
                               scaleFactor={1.0}
            />
        }
        return heatMap;
    }

    makeListContent() {
        let {errorMessage} = this.props;
        if (errorMessage) {
            return <ErrorPanel message={errorMessage}/>;
        } else {
            return this.makeListRowsContent();
        }
    }

    makeListRowsContent() {
        let {searchSettings, searchResults, searchDataLoaded} = this.props;
        let rangeType = searchSettings.geneList === CUSTOM_RANGES_LIST;
        let includeHeatMap = searchSettings.all === true;
        let rows = [];
        for (let i = 0; i < searchResults.length; i++) {
            let rowData = searchResults[i];
            let heatMap = this.makeHeatMap(rowData);
            rows.push(<ResultDetailRow rowData={rowData} key={i} heatMap={heatMap}
                                       rangeType={rangeType} includeHeatMap={includeHeatMap}/>)
        }
        return <Loader loaded={searchDataLoaded}>
            {rows}
        </Loader>;
    }

    render() {
        let {searchSettings, searchResults, searchDataLoaded, searchOperations, page, predictionStore} = this.props;
        let rangeType = searchSettings.geneList === CUSTOM_RANGES_LIST;
        let includeHeatMap = searchSettings.all === true;
        let listContent = this.makeListContent();
        let showPredictionDetails = Boolean(this.state.predictionData);
        return <div>
            <ResultHeaderRow rangeType={rangeType} includeHeatMap={includeHeatMap}/>

            <div id="resultsGridContainer" className="SearchResultsPanel__resultsGridContainer">
                {listContent}
            </div>

            <SearchResultsFooter
                searchSettings={searchSettings}
                searchResults={searchResults}
                searchDataLoaded={searchDataLoaded}
                searchOperations={searchOperations}
                page={page}
                predictionStore={predictionStore}
            />
            <PredictionDialog isOpen={showPredictionDetails}
                              onRequestClose={this.hidePredictionDetails}
                              data={this.state.predictionData}/>
        </div>
    }
}

export default SearchResultsPanel;
