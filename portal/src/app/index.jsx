import "babel-polyfill";
import React from 'react';
import {render} from 'react-dom';
import { browserHistory, Router, Route, fetchComponent} from 'react-router';
import SearchPage from './search/SearchPage.jsx'
import DataSourcesPage from './datasources/DataSourcesPage.jsx'
import PredictionPage from './prediction/PredictionPage.jsx'
import AboutPage from './about/AboutPage.jsx'
import {SEARCH_NAV, DATA_SOURCES_NAV, PREDICTION_NAV, ABOUT_NAV} from './models/Navigation.js'
import injectTapEventPlugin from 'react-tap-event-plugin';

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

render((
  <Router history={browserHistory}>
      <Route path={SEARCH_NAV.path} component={SearchPage}/>
      <Route path={PREDICTION_NAV.path} component={PredictionPage} />
      <Route path={DATA_SOURCES_NAV.path} component={DataSourcesPage}/>
      <Route path={ABOUT_NAV.path} component={AboutPage}/>
  </Router>
), document.getElementById('app'));
