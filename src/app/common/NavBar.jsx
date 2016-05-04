import React from 'react';
import { Link } from 'react-router'

import NavMenuButton from './NavMenuButton.jsx'
import {ALL_NAV} from '../store/Navigation.js'

class NavBar extends React.Component {
    render() {
        var items = [];
        for (let nav of ALL_NAV) {
            var className = "";
            if (nav.path === this.props.selected) {
                className = "Active";
            }
            items.push(<li key={nav.path} className={className}><Link to={nav.path}>{nav.label}</Link></li>)
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