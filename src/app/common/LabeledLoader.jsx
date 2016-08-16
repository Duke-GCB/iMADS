import React from 'react';
import Loader from 'react-loader';
require('./LabeledLoader.css');

class LabeledLoader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let {loaded, loadingStatusLabel, children, zIndex} = this.props;

        let labelDiv = [];
        if (!loaded) {
            labelDiv = <div className="LabeledLoader_label_container">
                <div className="LabeledLoader_label">
                    {loadingStatusLabel}
                </div>
            </div>
        }
        return <div>
            <Loader loaded={loaded} zIndex={zIndex}>
                {children}
            </Loader>
            {labelDiv}
        </div>

    }
}

export default LabeledLoader;