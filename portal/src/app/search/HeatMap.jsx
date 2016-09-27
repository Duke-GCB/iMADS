// Draws heatmap for prediction data
// Consists of a svg element with colored rectangles for each prediction.
import React from 'react';
import HeatMapData from '../models/HeatMapData.js';
import GenomeBrowserURL from '../models/GenomeBrowserURL.js';
require('./HeatMap.css');

class HeatMap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            detailsIsOpen: false,
        }
        this.genomeBrowserURL = new GenomeBrowserURL('human', this.props.data.trackHubUrl);
    }

    hideDetails = () => {
        this.setState({detailsIsOpen: false});
    };

    showDetails = () => {
        this.props.onClickHeatmap(this.props.data);
    };

    transcriptionStartVerticalLine(x) {
        if (this.props.data.isCustomRange) {
            return [];
        }
        let rectWidth = 1;
        // Transparent so doesn't completely obscure prediction underneath
        let blackColor = "rgba(0,0,0, 0.5)";
        return <rect x={x} y={0} width={rectWidth} height={this.props.height} fill={blackColor}  />
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
            height: this.props.height,
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
            <rect data-idxlist={heatCell.idxList} x={heatCell.x} y={0} width={heatCell.width} height={heatCell.height}
                  fill={heatCell.color} onClick={this.drillDown} data-url={url}
            />
        </g>
    }

    drillDown = (evt) => {
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
    };

    viewInGenomeBrowser = () => {
        let {setSelectedIndex} = this.props;
        if (this.genomeBrowserURL.trackHubUrl) {
            let data = this.props.data;
            window.open(this.genomeBrowserURL.getGeneURL(data.genome, data.chrom, data.start, data.end));
        } else {
            if (setSelectedIndex) {
                setSelectedIndex(undefined);
            }
        }
    };

    makeClickSurface(func) {
        let clickWidth = this.props.width - 1;
        let clickHeight = this.props.height;
        let transparentColor = 'rgba(0,0,0,0)';
        return <rect x={0} y={0} width={clickWidth} height={clickHeight} fill={transparentColor} onClick={func}/>;
    }

    makeBorder() {
        return <rect x={0} y={0} width={this.props.width} height={this.props.height} fill="none" stroke="black" />
    }

    determineScale() {
        let {data, width} = this.props;
        let upstream = parseInt(data.upstream);
        let downstream = parseInt(data.downstream);
        let dataSize = upstream + downstream + 1;
        let viewSize = parseInt(width);
        let scale = viewSize / dataSize;
        if (data.isCustomRange) {
            scale = viewSize / (data.end - data.start);
        }
        return scale;
    }

    render() {
        let {classNamePrefix, data, width, height, onClickHeatmap} = this.props;
        let scale = this.determineScale();

        // Create foreground and background click surfaces
        let clickSurface = [];
        let backgroundClickSurface = [];
        let clickWidth = width - 1;
        if (onClickHeatmap) {
            clickSurface = this.makeClickSurface(this.showDetails);
        } else {
            backgroundClickSurface = this.makeClickSurface(this.viewInGenomeBrowser);
        }

        // Create border around predictions
        let border = this.makeBorder();

        // Create line that shows where the TSS is
        let transcriptionStartLine = this.transcriptionStartVerticalLine(this.getTranscriptionStartX(scale));

        // Create colored rectangles for each prediction
        let predictions = this.getHeatRects(scale);

        return <div className="HeatMap_div" >
                <svg className="HeatMap_svg"
                     width={width} height={height}
                     xmlns="http://www.w3.org/2000/svg">
                    {backgroundClickSurface}
                    {predictions}
                    {transcriptionStartLine}
                    {clickSurface}
                    {border}
                </svg>
            </div>;
    }
}

export default HeatMap;