const ENDPOINT = '/api/v1/custom_list';
const KEY_NAME = 'key';
const MAX_FILE_SIZE = 20 * 1024 * 1024;

class CustomFile {
    constructor(isGeneList, content) {
        this.type = 'range';
        if (isGeneList) {
            this.type = 'gene_list';
        }
        this.content = content;
    }
    uploadFile(onData, onError) {
        if (this.content.length > MAX_FILE_SIZE) {
            let file_size_mb = parseInt(this.content.length / 1024 / 1024 + 0.5);
            onError('File size too big ' + file_size_mb  + " MB. Maximum allowed is 20 MB.");
            return;
        }
        $.ajax({
            url: ENDPOINT,
            dataType: 'json',
            type: 'POST',
            cache: false,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                type: this.type,
                content: this.content,
            }),
            success: function (data) {
                onData(data[KEY_NAME]);
            }.bind(this),
            error: function (xhr, status, err) {
                if (xhr.responseJSON) {
                    err = xhr.responseJSON.message;
                }
                onError('Error uploading custom file: ' + err);
            }.bind(this)
        });
    }
}

//{"content":"Lines of text that we will upload.\nLineTwo."}' http://127.0.0.1:5000/api/v1/custom_list

 export default CustomFile;