export default class FileManager {
    constructor(account) {
        this.account = account;
    }

    getAll() {
        return new Promise((resolve, reject) => {
            this.account.oauth.get('cloud', {params: this.account.urls.cloud.files})
            .then(result => {
                let root = DecodeFile({
                    id: this.account.get('rootFileId'),
                    isFolder: true,
                    name: this.account.get('rootFileId'),
                    url: 'https://drive.google.com/drive/'
                });
                let files = new Map([[root.id, root]]);

                for (let file of result.files) {
                    files.set(file.id, DecodeFile(file));
                }

                for (let [fileId, file] of files) {
                    for (let parentId of file.parents) {
                        if (files.has(parentId)) {
                            files.get(parentId).children.push(fileId);
                        }
                        else {
                            file.parents.splice(file.parents.indexOf(parentId), 1);
                        }
                    }
                }

                for (let [fileId, file] of files) {
                    if (file.parents.length == 0) {
                        files.delete(fileId);
                    }
                }

                resolve(files);
            });
        });
    }
}

function DecodeFile(file) {
    return {
        id: file.id,
        isFolder: (file.mimeType == 'application/vnd.google-apps.folder' || !!file.isFolder),
        url: (!!file.url) ? file.url : file.webViewLink,
        name: file.name,
        parents: (Array.isArray(file.parents)) ? file.parents : [],
        children: (Array.isArray(file.children)) ? file.children : []
    }
}

function EncodeFile(file) {
    return {};
}