import React from 'react';
import PredictionDialog from './PredictionDialog.jsx'

class HeatMap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            detailsIsOpen: false,
        }
        this.hideDetails = this.hideDetails.bind(this);
        this.showDetails = this.showDetails.bind(this);
        this.onClickHeatCell = this.onClickHeatCell.bind(this);
    }

    hideDetails() {
        this.setState({detailsIsOpen: false});
    }

    showDetails() {
        this.setState({detailsIsOpen: true});
    }

    transcriptionStartRect(x) {
        var rect_width = 1;
        var style = {
            fill: "rgba(0,0,0, 0.5)",
        }
        return <rect x={x} y={0} width={rect_width} height={this.props.height} style={{style}}  />
    }

    getTranscriptionStartX(scale) {
        if (this.props.data.strand == '-') {
            return parseInt(this.props.data.downstream * scale) + 1;
        } else {
            return parseInt(this.props.data.upstream * scale) + 1;
        }
    }

    getHeatRects(scale) {
        var result = [];
        var last
        for (var i = 0; i < this.props.data.values.length; i++) {
            var data = this.props.data.values[i];
            var heatCell = {
                color: this.getHeatColor(data),
                x: this.getHeatX(data, scale),
                width: this.getHeatWidth(data, scale),
                height: this.props.height-2,
                title: this.getHeatTitle(data),
            };
            result.push(this.makeHeatRect(i, heatCell));
        }
        return result;
    }

    makeHeatRect(idx, heatCell) {
        return <g>
            {heatCell.title}
            <rect data-idx={idx} x={heatCell.x} y={1} width={heatCell.width} height={heatCell.height} style={{fill:heatCell.color}}
                  onClick={this.onClickHeatCell}
            />
        </g>
    }

    getHeatColor(data) {
        var value = data.value;
        var rev_color = 1 - value;
        var red = 255;
        var green = parseInt(255 * rev_color);
        var blue = parseInt(255 * rev_color);
        var fill = "rgb(" + red + "," + green + "," + blue + ")";
        return fill;
    }

    getHeatX(data, scale) {
        var start = data.start;
        var value = data.value;
        return parseInt((start - this.props.data.start) * scale);
    }

    getHeatWidth(data, scale) {
        return Math.max(1, parseInt(20 * scale));
    }

    getHeatTitle(data) {
        var title = [];
        if (!this.props.showDetailsOnClick) {
            title = <title>{data.value} @ {data.start}</title>;
        }
        return title;
    }

    onClickHeatCell(evt) {
        var rect = evt.target;
        var data = this.props.data.values[rect.getAttribute('data-idx')];
        alert(data.start + "@" + data.value);
    }

    render() {
        var data_size = this.props.data.upstream + this.props.data.downstream + 1;
        var view_size = this.props.width;
        var scale = view_size / data_size;

        var borderStyle = {
            strokeWidth: 1,
            stroke: 'rgb(0,0,0)',
            fill: 'rgba(0,0,0,0)',
        }
        var transcriptionStart = this.transcriptionStartRect(this.getTranscriptionStartX(scale));
        var predictions = this.getHeatRects(scale);
        /*
        for (var i = 0; i < this.props.data.values.length; i++) {
            var data = this.props.data.values[i];
            var start = data.start;
            var value = data.value;
            var x = parseInt((start - this.props.data.start) * scale);
            var rev_color = 1 - value;
            var red = 255;
            var green = parseInt(255 * rev_color);
            var blue = parseInt(255 * rev_color);
            var fill = "rgb(" + red + "," + green + "," + blue + ")";
            var width = Math.max(1, parseInt(20 * scale));
            var title = [];
            if (!this.props.showDetailsOnClick) {
                title = <title>{data.value} @ {data.start}</title>;
            }
            predictions.push(<g>
                {title}
                <rect x={x} y={1} width={width} height={this.props.height-2} style={{fill:fill}} />
                </g>)
        }*/
        var popupDialog = [];
        var clickSurface = [];
        if (this.props.showDetailsOnClick) {
            popupDialog = <PredictionDialog isOpen={this.state.detailsIsOpen}
                                            onRequestClose={this.hideDetails}
                                            data={this.props.data}/>;
            clickSurface = <rect x={0} y={0} width={this.props.width - 1} height={this.props.height}
                                 style={borderStyle} onClick={this.showDetails}/>;
        }
        return <div style={{display: 'inline-block', marginTop: '1px'}}>
                <svg width={this.props.width} height={this.props.height} xmlns="http://www.w3.org/2000/svg">
                    <rect class="bar" x={0} y={0} width={this.props.width - 1} height={this.props.height}
                                 style={borderStyle} />
                    {predictions}
                    {transcriptionStart}
                    {clickSurface}
                </svg>
                {popupDialog}
            </div>
    }
}

export default HeatMap;