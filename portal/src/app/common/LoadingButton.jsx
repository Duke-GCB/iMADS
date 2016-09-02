import React from 'react';
import Loader from 'react-loader';

class LoadingButton extends React.Component {
    render() {
        let {loading, onClick, label, disabled} = this.props;

        return <Loader loaded={!loading}>
            <button className="btn btn-default"
                    disabled={disabled}
                    type="button"
                    onClick={onClick}
            >{label}</button>
        </Loader>
    }
}

export default LoadingButton;