import React from 'react';

/**
 * Creates a wide three pane 
 */
export default class ThreePanelPane extends React.Component {
    render() {
        let {topPanel, leftPanel, rightPanel} = this.props;
        return <div className="container expandWidth">
                    <div className="row">
                        <div className="col-md-offset-2 col-sm-offset-2 col-xs-offset-2 col-col-md-10 col-sm-10" >
                            {topPanel}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-2 col-sm-2 col-xs-2"  >
                            {leftPanel}
                        </div>
                        <div className="col-md-10 col-sm-10 col-xs-10" >
                            {rightPanel}
                        </div>
                    </div>
                </div>;
    }
}