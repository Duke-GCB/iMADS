import React from 'react';

export default class TitledPanel extends React.Component {
    render() {
        let {title, subTitle, children} = this.props;
        return <div className="panel panel-default">
            <div className="panel-heading">
                <h3 className="panel-title">{title}</h3>
            </div>
            <div className="panel-body">
                <div>
                    <h5>{subTitle}</h5>
                </div>
                {children}
            </div>
        </div>;
    }
}
