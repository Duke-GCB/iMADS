import {getAndLogErrorMessage} from './AjaxErrorMessage.js'
import {URL} from './AppSettings.js'

const KEY_NAME = 'key';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const RANGE_TYPE = 'range';
const GENE_LIST_TYPE = 'gene_list';

class CustomFile {
    constructor(isGeneList, content) {
        this.isGeneList = isGeneList;
        this.content = content;
    }
    getType() {
        if (this.isGeneList) {
            return GENE_LIST_TYPE;
        }
        return RANGE_TYPE;
    }
    getFormattedContent() {
        let result = "";
        for (let line of this.content.split('\n')) {
            if (line) {
                let parts = line.split(/\t /)
                if (parts) {
                    if (this.isGeneList) {
                        result += parts[0] + "\n";
                    } else {
                        result += parts[0] + '\t' + parts[1] + '\t' + parts[2] + '\n';
                    }
                }
            }
        }
        return result;
    }
    uploadFile(onData, onError) {
        if (this.content.length > MAX_FILE_SIZE) {
            let fileSizeMB = parseInt(this.content.length / 1024 / 1024 + 0.5);
            onError('File size too big ' + fileSizeMB  + " MB. Maximum allowed is 20 MB.");
            return;
        }
        $.ajax({
            url: URL.customList,
            dataType: 'json',
            type: 'POST',
            cache: false,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                type: this.getType(),
                content: this.getFormattedContent(),
            }),
            success: function (data) {
                onData(data[KEY_NAME]);
            }.bind(this),
            error: function (xhr, status, err) {
                let message = getAndLogErrorMessage('uploading custom file', xhr, status, err);
                onError(message);
            }.bind(this)
        });
    }
}

export default CustomFile;
