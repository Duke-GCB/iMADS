import React from 'react';
import NavBar from '../common/NavBar.jsx'
import {ABOUT_NAV} from '../models/Navigation.js'
import PageContent from '../common/PageContent.jsx'
import PageTitle from '../common/PageTitle.jsx'
import AboutContent from './AboutContent.jsx'

class AboutPage extends React.Component {
    render() {
        return <div>
            <NavBar selected={ABOUT_NAV.path}/>
            <PageContent>
                <PageTitle>About</PageTitle>
                <AboutContent />
            </PageContent>
        </div>;
    }
}

export default AboutPage;