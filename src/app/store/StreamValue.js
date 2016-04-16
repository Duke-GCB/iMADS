// Validates an upstream or downstream value entered by a user.
// These are upstream and downstream offsets from the transcription start site of a gene.
// The values must be integer and <= a maxValue.

class StreamValue {
    constructor(maxValue) {
        this.maxValue = maxValue;
    }

    isValid(strValue) {
        var errorMessage = this.checkForError('', strValue);
        return errorMessage.length == 0;
    }

    checkForError(name, strValue) {
        if (/^[0-9]+$/.test(strValue)) {
            var streamValue = parseInt(strValue);
            if (streamValue > this.maxValue) {
                return name + " must be <= " + this.maxValue + ".";
            }
            return '';
        } else {
            return name + " must be a positive number.";
        }
    }

}

export default StreamValue;