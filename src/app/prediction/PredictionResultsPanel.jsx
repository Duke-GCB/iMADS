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
        this.state = {
            predictionData: undefined,
        }
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

    render() {
        let {errorMessage, predictionSettings, searchResults, searchDataLoaded, loadingStatusLabel,
            searchOperations, page, predictionStore, showBlankWhenEmpty, startedSearch} = this.props;
        let rangeType = false;
        let includeHeatMap = predictionSettings.all === true;
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
                        startedSearch={startedSearch}
                        errorMessage={errorMessage}
                        showBlankWhenEmpty={showBlankWhenEmpty}

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
