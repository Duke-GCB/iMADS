import React from 'react';

/**
 * Creates a wide three pane 
 */
export default class ThreePanelPane extends React.Component {
    topPanelClassNames(leftSize, rightSize) {
        return "col-md-offset-" + leftSize + " col-sm-offset-" + leftSize + " col-xs-offset-" + leftSize +
            " col-col-md-" + rightSize + " col-sm-" + rightSize;
    }

    childPanelClassNames(size) {
        return "col-md-" + size + " col-sm-" + size + " col-xs-"  + size;
    }

    render() {
        let {topPanel, leftPanel, rightPanel, leftPanelSize} = this.props;
        if (leftPanelSize == undefined) {
            leftPanelSize = 2;
        }
        let rightPanelSize = 12 - leftPanelSize;
        let topPanelClassName = this.topPanelClassNames(leftPanelSize, rightPanelSize);
        let leftPanelClassName = this.childPanelClassNames(leftPanelSize);
        let rightPanelClassName = this.childPanelClassNames(rightPanelSize);

        return <div className="container expandWidth">
                    <div className="row">
                        <div className={topPanelClassName} >
                            {topPanel}
                        </div>
                    </div>
                    <div className="row">
                        <div className={leftPanelClassName}  >
                            {leftPanel}
                        </div>
                        <div className={rightPanelClassName} >
                            {rightPanel}
                        </div>
                    </div>
                </div>;
    }
}