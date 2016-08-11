import React from 'react';

export default class LoadSampleLink extends React.Component {
    onClickEvent = (evt) => {
        this.props.onClick();
        return true;
    };

    render() {
        let {hidden} = this.props;
        if (hidden) {
            return <div></div>;
        }
        return <button className="btn btn-link" href="" onClick={this.onClickEvent}>Load Sample Data</button>;
    }
}