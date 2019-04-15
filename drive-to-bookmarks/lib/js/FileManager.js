export default class FileManager {
    constructor(account) {
        this.account = account;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            this.account.oauth.get('cloud', {params: this.account.urls.cloud.files})
            .then(result => {
                let files = new Map();

                for (let file of result.files) {
                    files.set(file.id, DecodeFile(file));
                }

                resolve(files);
            });
        });
    }
}

function DecodeFile(file) {
    return {
        fileId: file.id,
        isFolder: (file.mimeType == 'application/vnd.google-apps.folder'),
        url: file.webViewLink,
        name: file.name,
        fileParentIds: new Set(file.parents)
    }
}

function EncodeFile(file) {
    return {};
}