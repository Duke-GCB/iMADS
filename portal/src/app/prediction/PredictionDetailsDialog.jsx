import React from 'react';
import Popup from '../common/Popup.jsx';
import HeatMap from '../search/HeatMap.jsx';
import PredictionDetailTable from '../common/PredictionDetailTable.jsx';
import PredictionDetail from '../models/PredictionDetail.js';

export default class PredictionDetailsDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedIndexList: []
        };
        this.predictionDetail = new PredictionDetail();
    }

    setSelectedIndex = (idxList) => {
        this.setState({
            selectedIndexList: idxList
        });
    };

    componentWillReceiveProps(nextProps) {
        if (nextProps.data) {
            this.setState({
                selectedIndexList: []
            });
        }
    }

    render() {
        let {selectedIndexList} = this.state;
        let {data, coreOffset, coreLength} = this.props;
        if (!data) {
            return <div></div>;
        }
        let detailList = [];
        for (let detailObj of this.predictionDetail.getDetails(data, data.chrom, selectedIndexList)) {
            let {rowClassName, start, end, value} = detailObj;
            let seq = this.predictionDetail.getSeqFromParentSequence(detailObj, data.sequence);
            detailObj.seq = seq;
            detailList.push(detailObj);
        }
        let title = "Predictions for " + data.title;
        return <Popup isOpen={this.props.isOpen}
                      onRequestClose={this.props.onRequestClose}
                      title={title}>
            <h5>Values</h5>
            <HeatMap width="800"
                     height="40"
                     data={data}
                     predictionColor={this.props.predictionColor}
                     setSelectedIndex={this.setSelectedIndex}
                     />
            <h5>Details</h5>
            <PredictionDetailTable
                showChromosomeColumn={false}
                detailList={detailList}
                coreOffset={coreOffset}
                coreLength={coreLength}

            />
        </Popup>;
    }
}
