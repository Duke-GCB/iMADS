import React from 'react';
require('./AboutContent.css');

class AboutContent extends React.Component {
    render() {

        return <div>
            <iframe src="static/html/about.html" className="AboutContent_iframe" >
                <p>Your browser does not support iframes please upgrade.</p>
            </iframe>
        </div>
    }
}

export default AboutContent;