import React from 'react';
import ArrowTooltip from '../common/ArrowTooltip.jsx'
require('./SelectItem.css');

class SelectItem extends React.Component {
    render() {
        let {title, selected, options, onChange, labelControl} = this.props;
        return <div className="SelectItem_container" >
            <label>
                {title}
            </label>
            <select className="form-control SelectItem_select"
                    value={selected}
                    onChange={onChange}>
                {options}
            </select>
            {labelControl}
        </div>
    }
}

export default SelectItem;