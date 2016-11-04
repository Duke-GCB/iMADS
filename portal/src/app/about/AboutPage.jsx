import React from 'react';
import Page from '../common/Page.jsx';
import {ABOUT_NAV} from '../models/Navigation.js'
import PageContent from '../common/PageContent.jsx'
import PageTitle from '../common/PageTitle.jsx'
import AboutContent from './AboutContent.jsx'

class AboutPage extends React.Component {
    render() {
        return <Page nav_path={ABOUT_NAV.path} >
            <PageContent>
                <PageTitle>About</PageTitle>
                <AboutContent />
            </PageContent>
        </Page>;
    }
}

export default AboutPage;