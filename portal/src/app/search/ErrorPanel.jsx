import React from 'react';
require('./ErrorPanel.css');

class ErrorPanel extends React.Component {
    render() {
        return <div className="ErrorPanel_topContainer">
            <div className="ErrorPanel_row ErrorPanel_top_row"></div>
            <div className="ErrorPanel_row ErrorPanel_errorCell">
                <img className="ErrorPanel_errorIcon" src="static/img/warning.svg" />
                <span className="ErrorPanel_errorText">{this.props.message}</span>
            </div>
            <div className="ErrorPanel_row ErrorPanel_bottom_row"></div>
        </div>;
    }
}

export default ErrorPanel;
