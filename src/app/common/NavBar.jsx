import React from 'react';
import { Link } from 'react-router'
import NavMenuButton from './NavMenuButton.jsx'
import {ALL_NAV} from '../store/Navigation.js'
require('./NavBar.css');

class NavBar extends React.Component {
    render() {
        let items = [];
        for (let nav of ALL_NAV) {
            let className = "";
            if (nav.path === this.props.selected) {
                className = "Active";
            }
            className += " NavBar_menu_item";
            items.push(<li key={nav.path} className={className}><Link to={nav.path}>{nav.label}</Link></li>)
        }
        return (
            <nav className="navbar navbar-default">
                <div className="collapse navbar-collapse NavBar_logo_container">
                    <div className="NavBar_logo_parent">
                    <a href="https://genome.duke.edu">
                        <img className="NavBar_logo_image" src="static/gcb-logo.png" /></a>
                        </div>

                </div>
                <div className="container-fluid">
                    <div className="row">
                        <div className="navbar-header">
                            <NavMenuButton />
                            <a className="navbar-brand NavBar_app_title" href="#">TF DNA Predictions</a>
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