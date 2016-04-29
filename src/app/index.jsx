import "babel-polyfill";
import React from 'react';
import {render} from 'react-dom';
import { browserHistory, Router, Route } from 'react-router';

import About from './About.jsx';
import DataSources from './DataSources.jsx';
import NavBar from './NavBar.jsx';
import SearchScreen from './SearchScreen.jsx';

import injectTapEventPlugin from 'react-tap-event-plugin';

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

class App extends React.Component {

    render () {
        return <div>
            <NavBar selected="/" />
            <SearchScreen url="/api/v1/settings" items_per_page="100"/>
        </div>
    }
}

//render(<App/>, document.getElementById('app'));
/*
render((
  <Router history={hashHistory}>
    <Route path="/" component={App}/>
  </Router>
), document.getElementById('app'))
*/
render((
  <Router history={browserHistory}>
      <Route path="/" component={App}/>
      <Route path="/datasources" component={DataSources}/>
      <Route path="/about" component={About}/>
  </Router>
), document.getElementById('app'))
