import ListenableMap from './ListenableMap.js'

export default class RegistryFilesMap extends ListenableMap {
    constructor(records, registry) {
        super(records);

        this.registry = registry;
        this.account = registry.account;
        this.bookmarks = registry.bookmarks;
    }

    delete(fileId) {
        if (super.has(fileId)) {
            let bookmarkIds = super.get(fileId);
            super.delete(fileId);

            for (let bookmarkId of bookmarkIds) {
                this.bookmarks.delete(bookmarkId);
            }
        }
    }

    set(fileId, bookmarkId) {
        if (!fileId) {
            return;
        }

        if (!super.has(fileId)) {
            super.set(fileId, []);
        }

        if (bookmarkId && !super.get(fileId).includes(bookmarkId)) {
            super.get(fileId).push(bookmarkId);
            this.bookmarks.set(bookmarkId, fileId);
        }
    }

    sync() {
        let fileIdsToCheck = this.account.files.getAll();

        for (let fileId of this.getAll()) {
            if (fileIdsToCheck.has(fileId)) {
                fileIdsToCheck.delete(fileId);
            }
            else {
                this.delete(fileId);
            }
        }

        for (let fileId of fileIdsToCheck) {
            this.set(fileId);
        }
    }
}