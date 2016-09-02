import React from 'react';
require('./ArrowTooltip.css');

class ArrowTooltip extends React.Component {
    render() {
        let {label, visible} = this.props;
        if (visible) {
            return <span className='ArrowTooltip_Container'>
                        <span className="ArrowTooltip_Arrow glyphicon glyphicon-arrow-left" aria-hidden="true"></span>
                        <span className="ArrowTooltip_Label">{label}</span>
                    </span>
        } else {
            return <span></span>
        }
    }
}

export default ArrowTooltip;