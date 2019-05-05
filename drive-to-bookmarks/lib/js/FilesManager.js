// import FileAPI from './FilesAPI.js'
import ListenableMap from './ListenableMap.js'

export default class FilesManager extends ListenableMap {
    constructor(account) {
        super();

        this.account = account;
        // this.registry = account.registry;
        // this.api = new FilesAPI(account);
    }

    add(files) {
        if (!(files instanceof Map)) {
            if (files.id) {
                files = new Map([[files.id, files]]);
            }
            else {
                return;
            }
        }

        let filesToCheck = new Map(files);

        let checkFile = file => {
            filesToCheck.delete(file.id);

            if (!(file.parents instanceof Set)) {
                return;
            }

            for (let parentId of file.parents) {
                if (filesToCheck.has(parentId)) {
                    checkFile(filesToCheck.get(parentId));
                }

                if (!this.has(parentId)) {
                    file.parents.delete(parentId);
                }
            }

            if (file.parents.size > 0 || file.id == this.account.get('rootFileId')) {
                this.set(file.id, file);
            }
        };

        for (let [fileId, file] of filesToCheck) {
            checkFile(file);
        }
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

            this.add(files);

            // Remove the extra, now non-existent files
            for (let fileId of this.getAll()) {
                if (!files.has(fileId)) {
                    this.list.delete(fileId);
                }
            }

            console.log(this);

            return this.account.bookmarks.update();

            // return Promise.resolve();
            // this.account.sync.full();
        });
    }

    save() {
        
    }

    set(fileId, file) {
        // if (super.has(fileId)) {
        //     this.sync.updateFile(file);
        // }
        // else {
        //     this.sync.addFile(file);
        // }

        super.set(fileId, file);
    }

    start() {
        return this.refresh();
        // .then(() => {
        //     return this.registry.files.sync();
        // });
    }
}

// TODO: THIS STUFF SHOULD GO IN `FileAPI.js`

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