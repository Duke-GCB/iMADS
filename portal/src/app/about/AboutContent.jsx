import React from 'react';
require('./AboutContent.css');

class AboutContent extends React.Component {
    makeAnchor(url) {
        let urlRef = "https://" + url;
        return <a href={urlRef}>{url}</a>;
    }

    render() {
        let websiteSource = this.makeAnchor("github.com/Duke-GCB/iMADS");
        let predictionSource = this.makeAnchor("github.com/Duke-GCB/Predict-TF-Binding");
        let preferenceSource = this.makeAnchor("github.com/Duke-GCB/Predict-TF-Preference");
        return <div>
            <div>
                iMADS enables searching and creating transcription factor binding predictions and preferences.
            </div>
            <br />
            <div>
                <span className="AboutContent_source_code_label">Source Code</span>
                <ul>
                    <li>Website: {websiteSource}</li>
                    <li>TF binding predictions: {predictionSource}</li>
                    <li>TF preference: {preferenceSource}</li>
                </ul>
            </div>
        </div>;
    }
}

export default AboutContent;
