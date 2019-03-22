import {SimpleBookmark} from './BookmarkManager.js'

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
                    files.set(file.id, {
                        name: file.name,
                        parents: file.parents,
                        url: file.webViewLink,
                        type: file.mimeType
                    });
                }

                resolve(files);
            });
        });
    }
}

export class SimpleFile {
    constructor(properties) {
        this.name;
        this.id;
        this.url;
        this.isFolder;
        this.parentId;

        Object.assign(this, properties);
    }
}