import React from 'react';
import Popup from '../common/Popup.jsx';
import RadioButton from '../common/RadioButton.jsx';
import {COLUMN_FORMAT_STANDARD} from '../models/ColumnFormats.js';

export default class DownloadData extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fieldSeparator: 'tsv',
            selectedColumnFormatName: COLUMN_FORMAT_STANDARD,
        }
    }

    getFormats() {
        let {dataStore, searchSettings} = this.props;
        return dataStore.getDownloadColumnFormats(searchSettings);
    }

    onRequestClose = () => {
        this.props.onClose()
    };

    onChangeFieldSeparator = (changeEvent) => {
        this.setState({
            fieldSeparator: changeEvent.target.value
        })
    };

    onChangeSelectedColumnFormatName = (changeEvent) => {
        let {dataStore, searchSettings} = this.props;
        const columnFormatName = changeEvent.target.value;
        let columnFormats = dataStore.getDownloadColumnFormats(searchSettings);
        var {fieldSeparator} = this.state;
        if (columnFormats[columnFormatName].isTabDelimited) {
            fieldSeparator = 'tsv';
        }
        if (columnFormats[columnFormatName].isCSV) {
            fieldSeparator = 'csv';
        }
        this.setState({
            selectedColumnFormatName: columnFormatName,
            fieldSeparator: fieldSeparator
        })
    };

    makeDownloadURL = () => {
        let {dataStore, searchSettings} = this.props;
        let {fieldSeparator, selectedColumnFormatName} = this.state;
        return dataStore.getDownloadURL(fieldSeparator, selectedColumnFormatName, searchSettings);
    };

    render() {
        let {dataStore, searchSettings, isVisible} = this.props;
        let downloadURL = this.makeDownloadURL();
        let columnFormats = dataStore.getDownloadColumnFormats(searchSettings);
        let columnFormatItems = [];
        let disableFieldSeparator = false;
        for (var key in columnFormats) {
            const columnFormat = columnFormats[key]
            columnFormatItems.push(
                <RadioButton
                        name={key} label={columnFormat.label} value={key} key={key}
                        selectedValue={this.state.selectedColumnFormatName}
                        onChangeSelectedValue={this.onChangeSelectedColumnFormatName}
                    />
            )
            if (key === this.state.selectedColumnFormatName) {
                disableFieldSeparator = columnFormat.isTabDelimited || columnFormat.isCSV;
            }
        }
        return <Popup isOpen={isVisible}
                      onRequestClose={this.onRequestClose}
                      title="Download" >
            <form className="form">
                <div className="form-group">
                    <label>Column Format</label>
                    {columnFormatItems}
                </div>
                <div className="form-group">
                    <label>Field Separator</label>
                    <RadioButton
                        name="tsvValue" label="Tab Delimited" value="tsv"
                        isDisabled={disableFieldSeparator}
                        selectedValue={this.state.fieldSeparator} onChangeSelectedValue={this.onChangeFieldSeparator}
                    />
                    <RadioButton
                        name="csvValue" label="CSV (comma separated values)" value="csv"
                        isDisabled={disableFieldSeparator}
                        selectedValue={this.state.fieldSeparator} onChangeSelectedValue={this.onChangeFieldSeparator}
                    />
                </div>
            </form>
            <div className="btn-toolbar">
                <a className="btn btn-primary btn-large" href={downloadURL} download>Download</a>
                <a className="btn btn-default btn-large" onClick={this.onRequestClose}>Close</a>

            </div>
        </Popup>;
    }
}
