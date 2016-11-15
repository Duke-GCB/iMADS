const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES_ERROR = "Content too big max 20MB";

/**
 * Provides a common interface for retrieving/processing the data for uploading to the webserver.
 * Consumes input from a <input type=file> or a text area.
 */
export default class UploadContent {
    constructor(file, textValue) {
        this.file = file;
        this.textValue = textValue;
    }

    _fetchContent(consumeText) {
        let reader = new FileReader();
        reader.onload = function (e) {
            consumeText(reader.result);
        };
        reader.readAsText(this.file);
    }

    fetchData(consumeText) {
        if (this.isTooBig()) {
            throw new Error(this.getTooBigErrorMessage());
        }
        if (this.file) {
            return this._fetchContent(consumeText, false);
        } else {
            consumeText(this.textValue);
        }
    }

    getTooBigErrorMessage() {
        return MAX_UPLOAD_BYTES_ERROR;
    }

    isTooBig() {
        let size = 0;
        if (this.file) {
            size = this.file.size;
        } else {
            if (this.textValue) {
                size = this.textValue.length;
            }
        }
        return size > MAX_UPLOAD_BYTES;
    }
}
