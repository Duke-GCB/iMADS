import React from 'react';
import Modal from 'react-modal';
import HeatMap from '../search/HeatMap.jsx';
import GenomeBrowserURL from '../store/GenomeBrowserURL.js';
import DnaSequences from '../store/DnaSequences.js';
import ColorDNA from '../search/ColorDNA.jsx';

const customStyles = {
    content : {

    },
    overlay : {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 100,
    }
};

function sortByStart(a, b) {
  if (a.start < b.start) {
    return -1;
  }
  if (a.start > b.start) {
    return 1;
  }
  return 0;
}

export default class PredictionDetailsDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ranges: {}
        }
        this.onDnaRangesResponse = this.onDnaRangesResponse.bind(this);
        this.onDnaRangesError = this.onDnaRangesError.bind(this);
    }

    componentDidUpdate() {
    }

    onDnaRangesResponse(ranges) {
        this.setState({
            'ranges': ranges
        })
    }

    onDnaRangesError(error) {
        alert(error);
    }

    render() {
        if (!this.props.data) {
            return <div></div>;
        }
        let rowData = this.props.data;
        let details = [];
        let values = rowData.values.slice();
        values.sort(sortByStart);
        for (let i = 0; i < values.length; i++) {
            let prediction = values[i];
            let position = this.props.data.chrom + ":" + prediction.start  + '-' + prediction.end;
            let seq = this.props.data.sequence.substring(prediction.start, prediction.end);
            details.push(<tr>
                <td>{prediction.start}</td>
                <td>{prediction.end}</td>
                <td>{prediction.value}</td>
                <td><ColorDNA seq={seq} /></td>
            </tr>)
        }
        return <Modal className="Modal__Bootstrap modal-dialog modal-lg"
                      isOpen={this.props.isOpen}
                      onRequestClose={this.props.onRequestClose}
                      style={customStyles} >
                    <div >
                        <div className="modal-header">
                          <button type="button" className="close" onClick={this.props.onRequestClose}>
                            <span aria-hidden="true">&times;</span>
                            <span className="sr-only">Close</span>
                          </button>
                          <h4 className="modal-title">Predictions for {rowData.title}</h4>
                        </div>
                        <div className="modal-body">
                            <h5>Values</h5>
                            <HeatMap width="800"
                                     height="40"
                                     data={rowData}
                                     predictionColor={this.props.predictionColor}
                            />
                            
                            <h5>Details</h5>
                            <table className="table" style={{width: 300}}>
                                <thead>
                                    <tr><th>Start</th><th>End</th><th>Value</th><th>Sequence</th></tr>
                                </thead>
                                <tbody>
                                    {details}
                                </tbody>
                            </table>
                        </div>
                  </div>
                </Modal>
    }
}
