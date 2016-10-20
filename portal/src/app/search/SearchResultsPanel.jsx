import React from 'react';
import PredictionDialog from './PredictionDialog.jsx'
import HeatMap from './HeatMap.jsx'
import {getTrackHubUrl} from '../models/GenomeData.js';
import {CUSTOM_RANGES_LIST} from '../models/CustomList.js'
import SearchResultsFooter from './SearchResultsFooter.jsx'
import DataGrid from '../common/DataGrid.jsx';
require('./SearchResultsPanel.css')

class SearchResultsPanel extends React.Component {
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

    makeLocationCell = (item) => {
        if (item.chrom) {
            return <span>{item.chrom}:{item.start}-{item.end}</span>;
        } else {
            return <span></span>;
        }
    };

    makeHeatmapCell = (item, key) => {
        let {searchSettings, predictionColor} = this.props;
        let rangeType = searchSettings.geneList === CUSTOM_RANGES_LIST;
        let combinedName = item.commonName + " (" + item.name + ") ";
        let offsetsStr = " upstream:" + searchSettings.upstream + " downstream:" + searchSettings.downstream;
        let trackHubUrl = getTrackHubUrl(this.props.genomeData, searchSettings.genome);
        let title = combinedName + " " + offsetsStr;
        if (rangeType) {
            title = item.chrom + ":" + item.start + "-" + item.end;
        }
        let heatMapValues = {
            title: title,
            values: item.values,
            start: item.start,
            end: item.end,
            strand: item.strand,
            upstream: searchSettings.upstream,
            downstream: searchSettings.downstream,
            chrom: item.chrom,
            genome: this.props.searchSettings.genome,
            trackHubUrl: trackHubUrl,
            isCustomRange: rangeType,
        };
        return <HeatMap width="120" height="19"
                        key={key}
                        onClickHeatmap={this.showPredictionDetails}
                        data={heatMapValues}
                        predictionColor={predictionColor} />
    };

    makeGridColumnInfo() {
        let {searchSettings} = this.props;
        if (searchSettings.geneList === CUSTOM_RANGES_LIST) {
            return this.makeRangeColumnInfo();
        }
        let columnInfo = [
            {fieldName: 'commonName', title: 'Name', type: 'text'},
            {fieldName: 'name', title: 'ID', type: 'text'},
            {fieldName: 'strand', title: 'Strand', type: 'text'},
            {fieldName: 'location', title: 'Location', type: 'location', makeControlFunc: this.makeLocationCell},
            {fieldName: 'max', title: 'Max', type: 'text'}
        ];
        if (searchSettings.all) {
            columnInfo.push({
                fieldName: 'values',
                title: 'Values',
                type: 'heatmap',
                tdHeight: '20px',
                makeControlFunc: this.makeHeatmapCell});
        }
        return columnInfo;
    }

    makeRangeColumnInfo() {
        let {searchSettings} = this.props;
        let columnInfo = [
            {fieldName: 'location', title: 'Name', type: 'location', makeControlFunc: this.makeLocationCell},
            {fieldName: 'max', title: 'Max', type: 'text'}
        ];
        if (searchSettings.all) {
            columnInfo.push({fieldName: 'values', title: 'Values', type: 'heatmap', makeControlFunc: this.makeHeatmapCell});
        }
        return columnInfo;
    }

    render() {
        let {searchSettings, searchResults, searchDataLoaded, searchOperations,
            page, predictionStore, predictionColor, coreRange, showBlankWhenEmpty,
            errorMessage} = this.props;
        let showPredictionDetails = Boolean(this.state.predictionData);
        let gridColumnInfo = this.makeGridColumnInfo();
        let dataGridClassNamePrefix = "SearchResultsPanel_DataGrid_";
        let headerClassNamePrefix = "";
        if (searchSettings.all) {
            headerClassNamePrefix = "Narrow_";
        }
        return <div>
            <DataGrid
                        fullScreen={true}
                        classNamePrefix="SearchResultsPanel_DataGrid_"
                        headerClassNamePrefix={headerClassNamePrefix}
                        columnInfo={gridColumnInfo}
                        rows={searchResults}
                        searchDataLoaded={searchDataLoaded}
                        loadingStatusLabel="Loading"
                        showBlankWhenEmpty={!searchDataLoaded}
                        errorMessage={errorMessage}
                    />
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
