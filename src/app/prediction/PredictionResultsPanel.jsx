import React from 'react';

import LabeledLoader from '../common/LabeledLoader.jsx'
import PredictionDetailsDialog from './PredictionDetailsDialog.jsx'
import HeatMap from '../search/HeatMap.jsx'
import ErrorPanel from '../search/ErrorPanel.jsx'
import {PredictionResultHeaderRow, PredictionResultDetailRow} from './PredictionResultRow.jsx'
import SearchResultsFooter from '../search/SearchResultsFooter.jsx'
import DataGrid from '../common/DataGrid.jsx'

require('./PredictionResultsPanel.css')

class PredictionResultsPanel extends React.Component {
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
        let {predictionSettings, predictionColor} = this.props;
        let heatMap = <span></span>;
        if (predictionSettings.all === true) {
            let title = rowData.name;

            let heatMapValues = {
                title: title,
                values: rowData.values,
                start: 0,
                end: rowData.sequence.length,
                strand: rowData.strand,
                chrom: rowData.chrom,
                trackHubUrl: '',
                isCustomRange: true,
                sequence: rowData.sequence,
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
        let {errorMessage, searchResults, searchDataLoaded, hasSequences} = this.props;
        if (errorMessage) {
            return <ErrorPanel message={errorMessage}/>;
        }
        if (searchResults.length == 0 && searchDataLoaded && hasSequences) {
            return <div className="centerChildrenHorizontally">
                    <span className="SearchResultsPanel__no_results_found centerVertically">No results found.</span>
                </div>
        }
        return this.makeListRowsContent();
    }

    makeListRowsContent() {
        let {predictionSettings, searchResults, searchDataLoaded, loadingStatusLabel} = this.props;
        let rangeType = false;
        let includeHeatMap = predictionSettings.all === true;
        let rows = [];
        for (let i = 0; i < searchResults.length; i++) {
            let rowData = searchResults[i];
            let heatMap = this.makeHeatMap(rowData);
            rows.push(<PredictionResultDetailRow rowData={rowData} key={i} heatMap={heatMap}
                                       rangeType={rangeType} includeHeatMap={includeHeatMap}/>)
        }
        return <LabeledLoader loaded={searchDataLoaded}
                              loadingStatusLabel={loadingStatusLabel}
                              zIndex={100}>
                {rows}
            </LabeledLoader>;
    }

    makeGridColumnInfo() {
        let {predictionSettings} = this.props;
        let columnInfo = [
            {fieldName: 'name', title: 'Name', type: 'text'},
            {fieldName: 'sequence', title: 'Sequence', type: 'text'},
            {fieldName: 'max', title: 'Max', type: 'text'},
        ];
        if (predictionSettings.all) {
            columnInfo.push({fieldName: 'values', title: 'Values', type: 'heatmap', makeControlFunc: this.makeHeatmapCell});
        }
        return columnInfo;
    }
    
    makeHeatmapCell = (rowData) => {
        let {predictionColor} = this.props;
        let heatMapValues = {
                title: rowData.name,
                values: rowData.values,
                start: 0,
                end: rowData.sequence.length,
                strand: '',
                chrom: '',
                trackHubUrl: '',
                isCustomRange: true,
                sequence: rowData.sequence,
        };
        return <HeatMap width="120" height="20"
                               onClickHeatmap={this.showPredictionDetails}
                               data={heatMapValues}
                               scaleFactor={1.0}
                               predictionColor={predictionColor} />
    }
    
    render() {
        let {errorMessage, predictionSettings, searchResults, searchDataLoaded, loadingStatusLabel,
            searchOperations, page, predictionStore} = this.props;
        let rangeType = false;
        let includeHeatMap = predictionSettings.all === true;
        let listContent = this.makeListContent();
        let showPredictionDetails = Boolean(this.state.predictionData);
        let gridColumnInfo = this.makeGridColumnInfo();
        let gridRows = searchResults;
        return <div>
                 <DataGrid
                        classNamePrefix="PredictionResultsPanel_DataGrid_"
                        columnInfo={gridColumnInfo}
                        rows={gridRows}
                        searchDataLoaded={searchDataLoaded}
                        loadingStatusLabel={loadingStatusLabel}
                        errorMessage={errorMessage}
                    />
            <SearchResultsFooter
                searchSettings={predictionSettings}
                searchResults={searchResults}
                searchDataLoaded={searchDataLoaded}
                searchOperations={searchOperations}
                page={page}
                predictionStore={predictionStore}
            />
            <PredictionDetailsDialog isOpen={showPredictionDetails}
                                     onRequestClose={this.hidePredictionDetails}
                                     data={this.state.predictionData}
                                     predictionColor={this.props.predictionColor}
            />
        </div>
    }
}

export default PredictionResultsPanel;
