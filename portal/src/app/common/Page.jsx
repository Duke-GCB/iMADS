import React from 'react';
import ContactEmail from './ContactEmail.jsx';
import NavBar from './NavBar.jsx'
require('./Page.css');

/**
 * Root element for all pages displays navigation based on nav_path.
 * Includes a support email in the footer pushed to the bottom of the page.
 */
export default class Page extends React.Component {
    render() {
        let {nav_path, children} = this.props;
        return <div className="Page_container" >
            <div className="Page_content">
                <NavBar selected={nav_path} />
                {children}
            </div>
            <div className="Page_footer">
                <ContactEmail email="imads@duke.edu" />
            </div>

        </div>;
    }
}