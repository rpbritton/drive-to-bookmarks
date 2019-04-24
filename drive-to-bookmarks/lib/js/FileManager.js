import FileListManager from './FileListManager.js'

export default class FileManager {
    constructor(account) {
        this.account = account;
        this.list = new FileListManager(this.account);

        // this.load();
    }

    start() {
        this.refresh();
    }

    refresh() {
        return this.account.oauth.get('cloud', { params: this.account.urls.cloud.files })
        .then(result => {
            let root = DecodeFile({
                id: this.account.get('rootFileId'),
                isFolder: true,
                name: this.account.get('rootFileName'),
                url: 'https://drive.google.com/drive/'
            });
            let files = new Map([[root.id, root]]);

            for (let file of result.files) {
                files.set(file.id, DecodeFile(file));
            }

            this.list.add(files);

            // Remove the extra, now non-existent nodes
            for (let fileId of this.list.getAll()) {
                if (!files.has(fileId)) {
                    this.list.delete(fileId);
                }
            }

            console.log(this.list);

            this.account.sync.full();
        });
    }
}

function DecodeFile(file) {
    return {
        id: file.id,
        isFolder: (file.mimeType == 'application/vnd.google-apps.folder' || !!file.isFolder),
        url: (!!file.url) ? file.url : file.webViewLink,
        name: file.name,
        parents: new Set(file.parents)
    }
}

function EncodeFile(file) {
    return {};
}