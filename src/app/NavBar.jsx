import React from 'react';
import { Link } from 'react-router'

import NavMenuButton from './NavMenuButton.jsx'

class NavBar extends React.Component {
    render() {
        // The webserver must know to route these to index.html.
        var link_data = [{
            to: "/",
            label: "SEARCH GENOME"
        },{
            to: "/datasources",
            label: "DATA SOURCES"
        },{
            to: "/about",
            label: "ABOUT"
        },];
        var items = [];
        for (var i = 0; i < link_data.length; i++) {
            var link = link_data[i];
            var className = "";
            if (link.to === this.props.selected) {
                className = "Active";
            }
            items.push(<li key={link.to} className={className}><Link to={link.to}>{link.label}</Link></li>)
        }
        return (
            <nav className="navbar navbar-default">
                <div className="container-fluid">
                    <div className="row">
                    <div className="navbar-header">
                        <NavMenuButton />
                        <a className="navbar-brand" href="#">TF DNA Predictions</a>
                    </div>
                        </div>
                    <div className="row">
                    <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                        <ul className="nav navbar-nav">
                            {items}
                        </ul>
                    </div>
                        </div>
                </div>
            </nav>
        );
    }
}

export default NavBar;