import React from 'react';
import Modal from 'react-modal';
import HeatMap from './HeatMap.jsx'


const customStyles = {
  content : {

  },
    overlay : {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 100,
    }
};

class PredictionDialog extends React.Component {
    render() {
        var rowData = this.props.data;
        var details = [];
        for (var i = 0; i < rowData.values.length; i++) {
            var prediction = rowData.values[i];
            details.push(<tr><td>{prediction.start}</td><td>{prediction.value}</td></tr>)
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
                            <HeatMap width="800" height="40"
                                     showDetailsOnClick={false}
                                     data={rowData}/>
                            <h5>Details</h5>
                            <table className="table" style={{width: 300}}>
                                <tr><th>Location</th><th>Value</th></tr>
                            {details}
                            </table>
                        </div>
                  </div>
                </Modal>
    }
}

export default PredictionDialog;