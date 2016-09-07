// Dropdown for users to select a model
// Displays a user friendly name instead of the unique model name

import React from 'react';
import SelectItem from '../common/SelectItem.jsx';

export default class ModelSelect  extends React.Component {
    makeOption(model) {
        // Hides numeric portion of names from users.
        // Additional release should change this dropdown into categories.
        let userName = model.name.replace(/_.*/, '');
        return <option key={model.name} value={model.name}>{userName}</option>;
    }

    render() {
        let {models, selected, onChange} = this.props;

        let proteinOptions = models.map(this.makeOption);
        return <SelectItem
            title="Protein/Model:"
            selected={selected}
            options={proteinOptions}
            onChange={onChange}
        />
    }
}
