import React from 'react';
require('./SingleFileUpload.css');

class SingleFileUpload extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(evt) {
        let {onChangeFile} = this.props;

        let file = evt.target.files[0];
        if (file) {
            onChangeFile(file, evt.target.value)
        } else {
            onChangeFile(undefined, undefined);
        }
    }

    render() {
        let {fileValue, loading, onChangeFile} = this.props;
        return <input className="SingleFileUpload_input"
                      type="file"
                      onChange={this.onChange}
                      disabled={loading}
                      value={fileValue}
        />
    }
}

export default SingleFileUpload;