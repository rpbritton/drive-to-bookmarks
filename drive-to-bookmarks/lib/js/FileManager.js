export default class FileManager {
    constructor(account) {
        this.account = account;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            this.account.oauth.get('cloud', this.account.urls.cloud.files)
            .then(result => {
                let files = new Map();

                for (let file of result.files) {
                    files.set(file.id, SimplifyFile(file));
                }

                resolve(files);
            });
        });
    }
}

function SimplifyFile({id, mimeType, name, parents, url}) {
    return {
        id,
        isFolder: (mimeType == 'application/vnd.google-apps.folder'),
        url,
        name,
        parentIds: parents
    };
}
