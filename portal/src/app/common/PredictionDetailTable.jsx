import React from 'react';
import ColorDNA from '../search/ColorDNA.jsx';
require('./PredictionDetailTable.css');

export default class PredictionDetailTable extends React.Component {
    getHeader() {
        return this.makeHeaderRow("Chromosome", "Start", "End", "Value", "Sequence");
    }

    makeHeaderRow(chrom, start, end, value, sequence) {
        let {showChromosomeColumn} = this.props;
        if (showChromosomeColumn) {
            return <tr>
                <th>{chrom}</th>
                <th>{start}</th>
                <th>{end}</th>
                <th>{value}</th>
                <th>{sequence}</th>
            </tr>;
        } else {
            return <tr>
                <th>{start}</th>
                <th>{end}</th>
                <th>{value}</th>
                <th>{sequence}</th>
            </tr>;
        }
    }

    getDetails() {
        let details = [];
        let {detailList} = this.props;
        for (let detail of detailList) {
            let {rowClassName, chrom, start, end, value, seq} = detail;
            details.push(this.makeRow(rowClassName, chrom, start, end, value, seq));
        }
        return details;
    }

    makeRow(rowClassName, chrom, start, end, value, sequence) {
        let {showChromosomeColumn, coreOffset, coreLength} = this.props;
        let colorDna = <ColorDNA seq={sequence} coreOffset={coreOffset} coreLength={coreLength} />;
        if (showChromosomeColumn) {
            return <tr className={rowClassName}>
                <td>{chrom}</td>
                <td>{start}</td>
                <td>{end}</td>
                <td>{value}</td>
                <td>{colorDna}</td>
            </tr>;
        } else {
            return <tr className={rowClassName}>
                <td>{start}</td>
                <td>{end}</td>
                <td>{value}</td>
                <td>{colorDna}</td>
            </tr>;
        }
    }

    render() {
        let header = this.getHeader();
        let details = this.getDetails();
        return <table className="PredictionDetailTable_table table">
            <thead>
            {header}
            </thead>
            <tbody>
            {details}
            </tbody>
        </table>
    }

}
