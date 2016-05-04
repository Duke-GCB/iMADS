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
        var rectWidth = 1;
        var style = {
            fill: "rgba(0,0,0, 0.5)",
        }
        return <rect x={x} y={0} width={rectWidth} height={this.props.height} style={{style}}  />
    }

    getTranscriptionStartX(scale) {
        return parseInt(this.props.data.upstream * scale) + 1;
    }

    getHeatRects(scale) {
        var result = [];
        var cells = HeatMapData.buildCellArray(this.props.data.chrom, this.props.data.values, {
            xOffset: this.props.data.start,
            xOffsetEnd: this.props.data.end,
            strand: this.props.data.strand,
            includeTitle: !this.props.showDetailsOnClick,
            scale: scale,
            height: this.props.height-2,
        });
        for (var i = 0; i < cells.length; i++) {
            result.push(this.makeHeatRect(i, cells[i]));
        }
        return result;
    }

    makeHeatRect(idx, heatCell) {
        var title = [];
        if (heatCell.title) {
            title = <title>{heatCell.title}</title>;
        }
        var url = '';
        if (!this.props.showDetailsOnClick) {
            url = this.genomeBrowserURL.getPredictionURL(this.props.data.genome, this.props.data.chrom,
                heatCell.start, heatCell.end);
        }
        return <g>
            {title}
            <rect data-idx={idx} x={heatCell.x} y={0} width={heatCell.width} height={heatCell.height} style={{fill:heatCell.color}}
                  onClick={this.drillDown} data-url={url}
            />
        </g>
    }

    drillDown(evt) {
        var url = evt.target.getAttribute('data-url');
        window.open(url);
    }

    viewInGenomeBrowser() {
        var data = this.props.data;
        window.open(this.genomeBrowserURL.getGeneURL(data.genome, data.chrom, data.start, data.end));
    }

    render() {
        var data = this.props.data;
        var upstream = parseInt(data.upstream);
        var downstream = parseInt(data.downstream);
        var dataSize = upstream + downstream + 1;
        var viewSize = parseInt(this.props.width);
        var scale = viewSize / dataSize;
        if (data.isCustomRange) {
            scale = viewSize / (data.end - data.start);
        }
        var borderStyle = {
            strokeWidth: 1,
            stroke: 'rgb(0,0,0)',
            fill: 'rgba(0,0,0,0)',
        }

        var emptyStyle = {
            fill: 'rgba(0,0,0,0)',
        }
        var transcriptionStart = this.transcriptionStartRect(this.getTranscriptionStartX(scale));
        var predictions = this.getHeatRects(scale);
        var popupDialog = [];
        var clickSurface = [];
        var beforePredictions = [];
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