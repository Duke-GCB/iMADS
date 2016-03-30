import React from 'react'
import {render} from 'react-dom';
import NavBar from './NavBar.jsx'
import SearchScreen from './SearchScreen.jsx'

import injectTapEventPlugin from 'react-tap-event-plugin';

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

class App extends React.Component {




    render () {
        return <div>
            <NavBar />
            <SearchScreen url="/genomes" />
        </div>
    }
}

render(<App/>, document.getElementById('app'));
