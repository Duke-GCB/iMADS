import React from 'react';
import Modal from 'react-modal';
import HeatMap from './HeatMap.jsx';
import GenomeBrowserURL from '../store/GenomeBrowserURL.js';
import DnaSequences from '../store/DnaSequences.js';

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

class PredictionDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ranges: {}
        }
        this.onDnaRangesResponse = this.onDnaRangesResponse.bind(this);
        this.onDnaRangesError = this.onDnaRangesError.bind(this);
    }

    componentDidUpdate() {
        if (this.props.data) {
            let dnaSequences = new DnaSequences(this.props.data.genome);
            let values = this.props.data.values;
            let needsToUpdate = false;
            if (values.length > 0) {
                for (let i = 0; i < values.length; i++) {
                    let prediction = values[i];
                    let position = this.props.data.chrom + ":" + prediction.start + '-' + prediction.end;
                    dnaSequences.addRangeRequest(position, this.props.data.chrom, prediction.start, prediction.end);
                    if (position in this.state.ranges) {
                        continue;
                    }
                    needsToUpdate = true;
                }
                if (needsToUpdate) {
                    dnaSequences.fetchRanges(this.onDnaRangesResponse, this.onDnaRangesError);
                }
            }
        }
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
            let seq = '';
            if (position in this.state.ranges) {
                seq = this.state.ranges[position];
            }
            details.push(<tr>
                <td>{this.props.data.chrom}</td>
                <td>{prediction.start}</td>
                <td>{prediction.end}</td>
                <td>{prediction.value}</td>
                <td><span className="PredictionDialog_dna_seq">{seq}</span></td>
            </tr>)
        }
        let genomeBrowserURL = new GenomeBrowserURL('human', this.props.data.trackHubUrl);
        let allRangeGenomeBrowserURL = genomeBrowserURL.getPredictionURL(this.props.data.genome,
            this.props.data.chrom, this.props.data.start, this.props.data.end);
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
                            <h5>Values (on {rowData.strand} strand)
                                &nbsp;
                                <a alt="View in Genome Browser" title="View in Genome Browser"
                                   href={allRangeGenomeBrowserURL} target="_blank"
                                   style={{float: 'right', paddingRight: '24px'}}
                                >
                                    View in Genome Browser (on + strand)
                                </a>

                            </h5>
                            <HeatMap width="800" height="40"
                                     data={rowData}/>
                            <h5>Details</h5>
                            <table className="table" style={{width: 300}}>
                                <thead>
                                    <tr><th>Chromosome</th><th>Start</th><th>End</th><th>Value</th><th>Sequence</th></tr>
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

export default PredictionDialog;
