import React from 'react';
import ColorDNA from '../search/ColorDNA.jsx';
require('./PredictionDetailTable.css');

export default class PredictionDetailTable extends React.Component {
    getHeader() {
        return this.makeHeaderRow("header", "Chromosome", "Start", "End", "Value", "Sequence");
    }

    makeHeaderRow(key, chrom, start, end, value, sequence) {
        let {showChromosomeColumn} = this.props;
        if (showChromosomeColumn) {
            return <tr key={key}>
                <th>{chrom}</th>
                <th>{start}</th>
                <th>{end}</th>
                <th>{value}</th>
                <th>{sequence}</th>
            </tr>;
        } else {
            return <tr key={key}>
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
        let ctr = 0;
        for (let detail of detailList) {
            let {rowClassName, chrom, start, end, value, seq} = detail;
            if (chrom) { //ignore empty rows
                details.push(this.makeRow(ctr, rowClassName, chrom, start, end, value, seq));
                ctr += 1;
            }
        }
        return details;
    }

    makeRow(key, rowClassName, chrom, start, end, value, sequence) {
        let {showChromosomeColumn, coreOffset, coreLength} = this.props;
        let colorDna = <ColorDNA seq={sequence} coreOffset={coreOffset} coreLength={coreLength} />;
        if (showChromosomeColumn) {
            return <tr key={key} className={rowClassName}>
                <td>{chrom}</td>
                <td>{start}</td>
                <td>{end}</td>
                <td>{value}</td>
                <td>{colorDna}</td>
            </tr>;
        } else {
            return <tr key={key} className={rowClassName}>
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
