import React from 'react';
import Loader from 'react-loader';
require('./UploadSequenceButtons.css');

export default class UploadSequenceButtons extends React.Component {
    render() {
        let {loading, clickGeneratePredictions, generatePredictionsDisabled, clickViewPredictions} = this.props;

        return <Loader loaded={!loading}>
            <button className="btn btn-default UploadSequenceButtons_button"
                    disabled={generatePredictionsDisabled}
                    type="button"
                    onClick={clickGeneratePredictions}
            >Generate Predictions</button>
            
            <button className="btn btn-default UploadSequenceButtons_button"
                    type="button"
                    onClick={clickViewPredictions}
            >View Predictions</button>
        </Loader>
    }
}