// Dropdown for users to select a model
// Displays a user friendly name instead of the unique model name

import React from 'react';
import SelectItem from '../common/SelectItem.jsx';

export default class ModelSelect  extends React.Component {
    /**
     * Return an option tag based on the mode.
     * Returns separator if model is undefined.
     * @param model
     * @returns {XML}
     */
    makeOption(model) {
        // Hides numeric portion of names from users.
        // Additional release should change this dropdown into labeled categories.
        if (model) {
            let userName = model.name.replace(/_.*/, '');
            return <option key={model.name} value={model.name}>{userName}</option>;
        } else {
            return <option disabled>──────────</option>;
        }
    }

    /**
     * Adds undefined between families so we can create spacers in the dropdown.
     * @param proteinOptions
     * @returns {Array}
     */
    addSpacers(proteinOptions) {
        let result = [];
        if (proteinOptions.length > 0) {
            let lastFamily = proteinOptions[0].family;
            for (let model of proteinOptions) {
                if (model.family != lastFamily) {
                    result.push(undefined);
                }
                result.push(model);
                lastFamily = model.family;
            }
        }
        return result;
    }

    render() {
        let {models, selected, onChange} = this.props;
        let modelsWithSpacers = [];
        let proteinOptions = this.addSpacers(models).map(this.makeOption);
        return <SelectItem
            title="Protein/Model:"
            selected={selected}
            options={proteinOptions}
            onChange={onChange}
        />
    }
}
