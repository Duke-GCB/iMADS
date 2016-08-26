import React from 'react';
import HeatMapData from '../store/HeatMapData.js'
import GenomeBrowserURL from '../store/GenomeBrowserURL.js'

class HeatMap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            detailsIsOpen: false,
        }
        this.hideDetails = this.hideDetails.bind(this);
        this.showDetails = this.showDetails.bind(this);
        this.drillDown = this.drillDown.bind(this);
        this.viewInGenomeBrowser = this.viewInGenomeBrowser.bind(this);
        this.genomeBrowserURL = new GenomeBrowserURL('human', this.props.data.trackHubUrl);
    }

    hideDetails() {
        this.setState({detailsIsOpen: false});
    }

    showDetails() {
        this.props.onClickHeatmap(this.props.data);
    }

    transcriptionStartRect(x) {
        if (this.props.data.isCustomRange) {
            return [];
        }
        let rectWidth = 1;
        let style = {
            fill: "rgba(0,0,0, 0.5)",
        }
        return <rect x={x} y={0} width={rectWidth} height={this.props.height} style={{style}}  />
    }

    getTranscriptionStartX(scale) {
        return parseInt(this.props.data.upstream * scale) + 1;
    }

    getHeatRects(scale) {
        let {data, predictionColor} = this.props;
        let result = [];
        let cells = HeatMapData.buildCellArray(data.chrom, data.values, {
            xOffset: this.props.data.start,
            xOffsetEnd: this.props.data.end,
            strand: this.props.data.strand,
            includeTitle: !this.props.showDetailsOnClick,
            scale: scale,
            height: this.props.height-2,
            itemWidth: this.props.data.itemWidth
        }, predictionColor);
        for (let i = 0; i < cells.length; i++) {
            result.push(this.makeHeatRect(i, cells[i]));
        }
        return result;
    }

    makeHeatRect(idx, heatCell) {
        let title = [];
        if (heatCell.title) {
            title = <title>{heatCell.title}</title>;
        }
        let url = '';
        if (!this.props.showDetailsOnClick) {
            url = this.genomeBrowserURL.getPredictionURL(this.props.data.genome, this.props.data.chrom,
                heatCell.start, heatCell.end);
        }
        return <g>
            {title}
            <rect data-idxlist={heatCell.idxList} x={heatCell.x} y={0} width={heatCell.width} height={heatCell.height} style={{fill:heatCell.color}}
                  onClick={this.drillDown} data-url={url}
            />
        </g>
    }

    drillDown(evt) {
        let {setSelectedIndex} = this.props;
        if (this.genomeBrowserURL.trackHubUrl) {
            let url = evt.target.getAttribute('data-url');
            window.open(url);
        } else {
            if (setSelectedIndex) {
                let indexListStr = evt.target.getAttribute('data-idxlist');
                let indexes = indexListStr.split(",").map(function(x) { return parseInt(x);});
                setSelectedIndex(indexes);
            }
        }
    }

    viewInGenomeBrowser() {
        let {setSelectedIndex} = this.props;
        if (this.genomeBrowserURL.trackHubUrl) {
            let data = this.props.data;
            window.open(this.genomeBrowserURL.getGeneURL(data.genome, data.chrom, data.start, data.end));
        } else {
            if (setSelectedIndex) {
                setSelectedIndex(undefined);
            }
        }

    }

    render() {
        let data = this.props.data;
        let upstream = parseInt(data.upstream);
        let downstream = parseInt(data.downstream);
        let dataSize = upstream + downstream + 1;
        let viewSize = parseInt(this.props.width);
        let scale = viewSize / dataSize;
        if (data.isCustomRange) {
            scale = viewSize / (data.end - data.start);
        }
        let borderStyle = {
            strokeWidth: 1,
            stroke: 'rgb(0,0,0)',
            fill: 'rgba(0,0,0,0)',
        }

        let emptyStyle = {
            fill: 'rgba(0,0,0,0)',
        }
        let transcriptionStart = this.transcriptionStartRect(this.getTranscriptionStartX(scale));
        let predictions = this.getHeatRects(scale);
        let popupDialog = [];
        let clickSurface = [];
        let beforePredictions = [];
        if (this.props.onClickHeatmap) {
            clickSurface = <rect x={0} y={0} width={this.props.width - 1} height={this.props.height}
                                  style={emptyStyle} onClick={this.showDetails}/>;
        } else {
            beforePredictions = <rect x={0} y={0} width={this.props.width - 1} height={this.props.height}
                                 style={emptyStyle} onClick={this.viewInGenomeBrowser}/>;
        }
        return <div style={{display: 'inline-block', marginTop: '1px'}}>
                <svg style={{cursor: 'pointer', border: '1px solid grey'}} width={this.props.width} height={this.props.height}
                     xmlns="http://www.w3.org/2000/svg">
                    {beforePredictions}
                    {predictions}
                    {transcriptionStart}
                    {clickSurface}
                </svg>
                {popupDialog}
            </div>
    }
}

export default HeatMap;