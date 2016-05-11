import {URL} from './AppSettings.js'
import {getAndLogErrorMessage} from './AjaxErrorMessage.js'

export function fetchPredictionSettings(onData, onError) {
    $.ajax({
        url: URL.settings,
        dataType: 'json',
        type: 'GET',
        cache: false,
        success: function (data) {
            onData(data.genomes, data.maxBindingOffset);
        }.bind(this),
        error: function (xhr, status, err) {
            let message = getAndLogErrorMessage('fetching genome metadata', xhr, status, err);
            onError(message);
        }.bind(this)
    });
}

