import React from 'react';

/*
var HEATMAPDATA = {
    values: [ {start: 29417, value: 0.2088},
            {start: 29419, value: 0.2715},
            {start: 29199, value: 0.6715},
            ],
    start: 29170,
    end: 29570,
    upstream: 200,
    downstream: 200,
    strand: '-',
}
 */

class HeatMap extends React.Component {

    transcriptionStartRect(x) {
        var rect_width = 1;
        var style = {
            fill: "rgba(0,0,0, 0.5)",
        }
        return <rect x={x} y={0} width={rect_width} height={this.props.height} style={{style}}  />
    }

    getTranscriptionStartX(scale) {
        if (this.props.data.strand == '-') {
            return parseInt(this.props.data.upstream * scale) + 1;
        } else {
            return parseInt(this.props.data.downstream * scale) + 1;
        }
    }

    render() {
        var data_size = this.props.data.upstream + this.props.data.downstream + 1;
        var view_size = this.props.width;
        var scale = view_size / data_size;




        var borderStyle = {
            strokeWidth: 1,
            stroke: 'rgb(0,0,0)',
            fill: 'none',
        }
        var transcriptionStart = this.transcriptionStartRect(this.getTranscriptionStartX(scale));
        var predictions = [];
        for (var i = 0; i < this.props.data.values.length; i++) {
            var data = this.props.data.values[i];
            var start = data.start;
            var value = data.value;
            var x = parseInt((start - this.props.data.start) * scale);
            var rev_color = 1 - value;
            //255, 0, 0    vs 255, 255 ,255
            var red = 255;
            var green = parseInt(255 * rev_color);
            var blue = parseInt(255 * rev_color);
            var fill = "rgb(" + red + "," + green + "," + blue + ")";
            predictions.push(<rect x={x} y={0} width={1} height={this.props.height} style={{fill:fill}} />)
        }

        return <svg width={this.props.width} height={this.props.height}  >

            {transcriptionStart}
            {predictions}
            <rect x={0} y={0} width={this.props.width - 1} height={this.props.height} style={borderStyle}  />
        </svg>
    }
}

export default HeatMap;