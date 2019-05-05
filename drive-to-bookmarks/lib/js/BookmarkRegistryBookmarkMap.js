import ListenableMap from './ListenableMap.js'

export default class RegistryBookmarksMap extends ListenableMap {
    constructor(records, registry) {
        super();

        for (let [fileId, bookmarkIds] of records) {
            for (let bookmarkId of bookmarkIds) {
                super.set(bookmarkId, fileId);
            }
        }

        this.registry = registry;
        this.account = registry.account;
    }

    delete(bookmarkId) {
        if (super.has(bookmarkId)) {
            let fileId = super.get(bookmarkId);
            super.delete(bookmarkId);

            if (this.registry.files.has(fileId) && this.registry.files.get(fileId).includes(bookmarkId)) {
                let bookmarkIds = this.registry.files.get(fileId);

                bookmarkIds.splice(bookmarkIds.indexOf(bookmarkId), 1);
            }
        }
    }

    set(bookmarkId, fileId) {
        if (!bookmarkId || !fileId) {
            return;
        }

        if (super.get(bookmarkId) != fileId) {
            this.delete(bookmarkId);
        }
        super.set(bookmarkId, fileId);

        if (!this.registry.files.has(fileId) || !this.registry.files.get(fileId).includes(bookmarkId)) {
            this.registry.files.set(fileId, bookmarkId);
        }
    }

    sync() {
        
    }
}