const ENDPOINT = '/api/v1/custom_list';
const KEY_NAME = 'key';

class CustomFile {
    constructor(isGeneList, content) {
        this.type = 'range';
        if (isGeneList) {
            this.type = 'gene_list';
        }
        this.content = content;
    }
    uploadFile(onData, onError) {
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
                onError('Error uploading custom file ' + err);
            }.bind(this)
        });
    }
}

//{"content":"Lines of text that we will upload.\nLineTwo."}' http://127.0.0.1:5000/api/v1/custom_list

 export default CustomFile;