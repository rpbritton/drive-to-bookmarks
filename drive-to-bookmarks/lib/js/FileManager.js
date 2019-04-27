// import FileListManager from './FileListManager.js'

export default class FileManager extends Map {
    constructor(syncManager) {
        super();

        this.sync = syncManager;
    }

    start() {
        this.refresh();
    }

    refresh() {
        return this.sync.account.oauth.get('cloud', { params: this.sync.account.urls.cloud.files })
        .then(result => {
            let root = DecodeFile({
                id: this.sync.account.get('rootFileId'),
                isFolder: true,
                name: this.sync.account.get('rootFileName'),
                url: 'https://drive.google.com/drive/'
            });
            let files = new Map([[root.id, root]]);

            for (let file of result.files) {
                files.set(file.id, DecodeFile(file));
            }

            this.add(files);

            // Remove the extra, now non-existent nodes
            for (let fileId of this.getAll()) {
                if (!files.has(fileId)) {
                    this.list.delete(fileId);
                }
            }

            console.log(this);

            return Promise.resolve();
            // this.account.sync.full();
        });
    }

    add(files) {
        if (!(files instanceof Map)) {
            if (!!files.id) {
                files = new Map([[files.id, files]]);
            }
            else {
                return;
            }
        }

        let filesToCheck = new Map(files);

        let checkNode = file => {
            filesToCheck.delete(file.id);

            if (!(file.parents instanceof Set)) {
                return;
            }

            for (let parentId of file.parents) {
                if (filesToCheck.has(parentId)) {
                    checkNode(filesToCheck.get(parentId));
                }

                if (!this.has(parentId)) {
                    file.parents.delete(parentId);
                }
            }

            if (file.parents.size > 0 || file.id == this.sync.account.get('rootFileId')) {
                if (this.has(file.id)) {
                    this.update(file.id, file);
                }
                else {
                    this.set(file.id, file);
                    // this.file.setNode(node);
                    // this.bookmark.setNode(node);
                }
            }
        };

        for (let [fileId, file] of filesToCheck) {
            checkNode(file);
        }
    }

    getAll() {
        return new Set([...super.keys()]);
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