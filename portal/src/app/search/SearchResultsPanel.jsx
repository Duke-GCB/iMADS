import React from 'react';
import Loader from 'react-loader';

import PredictionDialog from './PredictionDialog.jsx'
import HeatMap from './HeatMap.jsx'
import ErrorPanel from './ErrorPanel.jsx'

import {getTrackHubUrl} from '../models/GenomeData.js';
import {CUSTOM_RANGES_LIST} from '../models/CustomList.js'
import {ResultHeaderRow, ResultDetailRow} from './ResultRow.jsx'
import SearchResultsFooter from './SearchResultsFooter.jsx'
require('./SearchResultsPanel.css')

class SearchResultsPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            predictionData: undefined,
        }
    }

    componentWillUpdate() {
    }

    showPredictionDetails = (predictionData) => {
        this.setState({
            predictionData: predictionData,
        })
    };

    hidePredictionDetails = (predictionData) => {
        this.setState({
            predictionData: undefined,
        })
    };

    makeHeatMap(rowData) {
        let {searchSettings, predictionColor} = this.props;
        let rangeType = searchSettings.geneList === CUSTOM_RANGES_LIST;
        let heatMap = <span></span>;
        if (searchSettings.all === true) {
            let combinedName = rowData.commonName + " (" + rowData.name + ") ";
            let offsetsStr = " upstream:" + searchSettings.upstream + " downstream:" + searchSettings.downstream;
            let trackHubUrl = getTrackHubUrl(this.props.genomeData, searchSettings.genome);
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
                               predictionColor={predictionColor}
            />
        }
        return heatMap;
    }

    makeListContent() {
        let {errorMessage, searchResults, searchDataLoaded} = this.props;
        if (errorMessage) {
            return <ErrorPanel message={errorMessage}/>;
        }
        if (searchResults.length == 0 && searchDataLoaded) {
            return <div className="centerChildrenHorizontally">
                    <span className="SearchResultsPanel__no_results_found centerVertically">No results found.</span>
                </div>
        }
        return this.makeListRowsContent();
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
        let {searchSettings, searchResults, searchDataLoaded, searchOperations,
            page, predictionStore, predictionColor, coreRange} = this.props;
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
                              data={this.state.predictionData}
                              predictionColor={predictionColor}
                              coreRange={coreRange}
                              modelName={searchSettings.model}
            />
        </div>
    }
}

export default SearchResultsPanel;
