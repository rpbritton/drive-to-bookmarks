export default class FileListManager extends Map {
    constructor(account) {
        super();

        this.account = account;
    }

    getAll() {
        return new Set([...super.keys()]);
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

            if (file.parents.size > 0 || file.id == this.account.get('rootFileId')) {
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

    update(fileId, changes) {
        Object.assign(this.list.get(fileId), changes);
    }
}