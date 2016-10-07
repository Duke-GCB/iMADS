// Table version of a progress bar with started, current, ellapsed and some message.

import React from 'react';
require('./ProgressTable.css')
let moment = require('moment');

export default class ProgressTable extends React.Component {
    formatDate(momentDate) {
        return momentDate.format("ddd MMM D H:mm:ss YYYY");
    }

    getEllapsed(started, current) {
        let unit = 'seconds';
        let elapsedSeconds = current.diff(started, unit);
        let hours = moment.duration(elapsedSeconds, unit).hours();
        let min = moment.duration(elapsedSeconds, unit).minutes();
        let sec = moment.duration(elapsedSeconds, unit).seconds();
        return this.twoDigits(hours) + ":" + this.twoDigits(min) + ":" + this.twoDigits(sec);
    }

    twoDigits(num) {
        let numStr = num.toString();
        if (numStr.length == 1) {
            numStr = "0" + numStr;
        }
        return numStr;
    }

    render() {
        let {startedDate, currentDate, status} = this.props;
        let started = moment(new Date(startedDate));
        let current = moment(new Date(currentDate));
        let elapsed = this.getEllapsed(started, current);
        if (!startedDate) {
            return <div>Loading</div>;
        }
        return <table className="ProgressTable_table">
            <tbody>
            <tr className="ProgressTable_tr_even">
                <td className="ProgressTable_td">Status</td>
                <td className="ProgressTable_td">{status}</td>
            </tr>
            <tr className="ProgressTable_tr_odd">
                <td className="ProgressTable_td">Submitted at</td>
                <td className="ProgressTable_td">{this.formatDate(started)}</td>
            </tr>
            <tr className="ProgressTable_tr_even">
                <td className="ProgressTable_td">Current time</td>
                <td className="ProgressTable_td">{this.formatDate(current)}</td>
            </tr>
            <tr className="ProgressTable_tr_odd">
                <td className="ProgressTable_td">Elapsed</td>
                <td className="ProgressTable_td">{elapsed}</td>
            </tr>
            </tbody>
        </table>;
    }
}
