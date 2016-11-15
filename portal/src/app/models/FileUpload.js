const PREVIEW_BYTES = 5000;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES_ERROR = "Content too big max 20MB";

class FileUpload {
    constructor(file) {
        // Users of this class should have already checked file with isTooBigToUpload or isTooBigFileOrText
        if (FileUpload.isTooBigToUpload(file.size)) {
            throw new Error(FileUpload.tooBigErrorMessage());
        }
        this.file = file;
    }

    _fetchContent(consumeText, previewText = false) {
        let fileUpload = this;
        let reader = new FileReader();
        reader.onload = function (e) {
            let text = reader.result;
            if (previewText) {
                text = fileUpload.formatPreview(text)
            }
            consumeText(text);
        }
        if (previewText) {
            reader.readAsText(this.file.slice(0, PREVIEW_BYTES));
        } else {
            reader.readAsText(this.file);
        }
    }

    fetchAllFile(consumeText) {
        return this._fetchContent(consumeText, false);
    }

    static isTooBigToUpload(size) {
        return size > MAX_UPLOAD_BYTES;
    }

    static tooBigErrorMessage() {
        return MAX_UPLOAD_BYTES_ERROR;
    }

    /**
     * If passed a file checks it's size otherwise checks the length of text.
     * Returns true if the item we check is too big
     */
    static isTooBigFileOrText(file, textValue) {
        let size = 0;
        if (textValue) {
            size = textValue.length;
        }
        if (file) {
            size = file.size;
        }
        return FileUpload.isTooBigToUpload(size);
    }
}


export default FileUpload;
