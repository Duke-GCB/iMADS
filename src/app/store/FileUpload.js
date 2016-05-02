const PREVIEW_BYTES = 5000;

class FileUpload {
    constructor(file) {
        this.file = file;
    }

    _fetchContent(consumeText, previewText = false) {
        let fileUpload = this;
        var reader = new FileReader();
        reader.onload = function (e) {
            var text = reader.result;
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

    formatPreview(text) {
        let lines = text.split('\n');
        return lines.slice(0, lines.length - 1).join('\n');
    }
}

export default FileUpload;