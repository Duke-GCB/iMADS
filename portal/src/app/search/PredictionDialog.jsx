import React from 'react';
import Popup from '../common/Popup.jsx';
import HeatMap from './HeatMap.jsx';
import PredictionDetailTable from '../common/PredictionDetailTable.jsx';
import GenomeBrowserURL from '../models/GenomeBrowserURL.js';
import DnaSequences from '../models/DnaSequences.js';
import PredictionDetail from '../models/PredictionDetail.js';
import {makeTitleForModelName} from '../models/Model.js';

class PredictionDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ranges: {}
        }
        this.predictionDetail = new PredictionDetail();
    }

    componentDidUpdate() {
        let {ranges} = this.state;
        let {data} = this.props;
        if (data) {
            let dnaSequences = new DnaSequences(data.genome);
            let needsToUpdate = false;
            for (let detailObj of this.predictionDetail.getDetails(data, data.chrom, undefined)) {
                let {position, start, end} = detailObj;
                // if we fetch one we must fetch all
                dnaSequences.addRangeRequest(position, data.chrom, start, end);
                if (position in ranges) {
                    continue;
                }
                needsToUpdate = true;
            }
            if (needsToUpdate) {
                dnaSequences.fetchRanges(this.onDnaRangesResponse, this.onDnaRangesError);
            }
        }
    }

    onDnaRangesResponse = (ranges) => {
        this.setState({
            'ranges': ranges
        })
    };

    onDnaRangesError = (error) => {
        alert(error);
    };

    render() {
        let {modelName, data, predictionColor, coreRange} = this.props;
        if (!data) {
            return <div></div>;
        }
        let detailList = [];
        for (let detailObj of this.predictionDetail.getDetails(data, data.chrom, undefined)) {
            let {chrom, start, end, value} = detailObj;
            let seq = this.predictionDetail.getSeqFromRanges(detailObj, this.state.ranges);
            detailObj.seq = seq;
            detailList.push(detailObj);
        }
        let genomeBrowserURL = new GenomeBrowserURL('human', this.props.data.trackHubUrl);
        let allRangeGenomeBrowserURL = genomeBrowserURL.getPredictionURL(this.props.data.genome,
            this.props.data.chrom, this.props.data.start, this.props.data.end);
        let title = makeTitleForModelName(modelName, data.title);
        return <Popup isOpen={this.props.isOpen}
                      onRequestClose={this.props.onRequestClose}
                      title={title}>
            <h5>Values (on {data.strand} strand)
                &nbsp;
                <a alt="View in Genome Browser" title="View in Genome Browser"
                   href={allRangeGenomeBrowserURL} target="_blank"
                   style={{float: 'right', paddingRight: '24px'}}>
                    View in Genome Browser (on + strand)
                </a>
            </h5>
            <HeatMap width="800" height="40"
                     data={data}
                     predictionColor={predictionColor}/>
            <h5>Details</h5>
            <PredictionDetailTable
                showChromosomeColumn={true}
                detailList={detailList}
                coreOffset={coreRange.coreOffset}
                coreLength={coreRange.coreLength}

            />
        </Popup>
    }
}

export default PredictionDialog;
