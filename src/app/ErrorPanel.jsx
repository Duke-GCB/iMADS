import React from 'react';

class ErrorPanel extends React.Component {
    render() {
        return <div style={{height:'100%', NObackgroundColor:'#555555'}} className="Aligner">
            <div className="Aligner-item Aligner-item--top"></div>
            <div className="Aligner-item errorCell">
                <img className="errorIcon" src="static/warning.svg" />
                <span className="errorText">{this.props.message}</span>
            </div>
            <div className="Aligner-item Aligner-item--bottom"></div>
        </div>;


    }
}

export default ErrorPanel;
