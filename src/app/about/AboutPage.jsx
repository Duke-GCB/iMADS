import React from 'react';
import NavBar from '../common/NavBar.jsx'
import PageTitle from '../common/PageTitle.jsx'
import ScrollingContainer from '../common/ScrollingContainer.jsx'
import AboutContent from './AboutContent.jsx'

class AboutPage extends React.Component {
    render() {
        return <div>
            <NavBar selected="/about"/>
            <div className="std_left_right_margin">
                <PageTitle>About</PageTitle>
                <ScrollingContainer height="80%">
                    <AboutContent />
                </ScrollingContainer>
            </div>

        </div>;
    }
}

export default AboutPage;