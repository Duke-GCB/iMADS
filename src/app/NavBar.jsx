import React from 'react';

import NavMenuButton from './NavMenuButton.jsx'

class NavBar extends React.Component {
    render() {
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
                            <li className="active"><a href="#">SEARCH GENOME <span className="sr-only">(current)</span></a>
                            </li>
                            <li><a href="#">DATA SOURCES</a></li>
                            <li><a href="#">ABOUT</a></li>
                        </ul>
                    </div>
                        </div>
                </div>
            </nav>
        );
    }
}

export default NavBar;