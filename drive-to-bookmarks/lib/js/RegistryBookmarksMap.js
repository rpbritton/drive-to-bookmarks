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
        this.bookmarks = registry.bookmarks;
    }

    delete(bookmarkId) {
        if (super.has(bookmarkId)) {
            let fileId = super.get(bookmarkId);
            super.delete(bookmarkId);

            if (this.files.has(fileId) && this.files.get(fileId).includes(bookmarkId)) {
                let bookmarkIds = this.files.get(fileId);

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

        if (!this.files.has(fileId) || !this.files.get(fileId).includes(bookmarkId)) {
            this.files.set(fileId, bookmarkId);
        }
    }

    sync() {
        
    }
}