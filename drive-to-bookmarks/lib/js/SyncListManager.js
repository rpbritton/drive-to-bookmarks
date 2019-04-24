export default class SyncListManager {
    constructor(account) {
        this.account = account;

        if (!Array.isArray(this.account.get('syncMap'))) {
            this.account.set('syncMap', []);
        }

        this.files = new FileMap(this.account);
        this.bookmarks = new BookmarkMap(this.account);
    }

    save() {
        this.account.set('syncMap', [...this.files.entries()]);
    }
}

class BetterMap extends Map {
    getAll() { return [...super.keys()]; }
}

class FileMap extends BetterMap {
    constructor(account) {
        super();

        this.account = account;

        for (let [fileId, bookmarkIds] of this.account.get('syncMap')) {
            if (Array.isArray(bookmarkIds)) {
                super.set(fileId, bookmarkIds);
            }
            else {
                super.set(fileId, []);
            }
        }
    }

    set(fileId, bookmarkId) {
        if (!super.has(fileId)) {
            super.set(fileId, []);
        }

        if (!!bookmarkId) {
            super.get(fileId).push(bookmarkId);
            this.map.bookmarks.set(bookmarkId, fileId);
        }
    }

    delete(fileId) {
        if (super.has(fileId)) {
            let bookmarkIds = super.get(fileId);
            super.delete(fileId);

            for (let bookmarkId of bookmarkIds) {
                this.map.bookmarks.delete(bookmarkId);
            }
        }
    }
}

class BookmarkMap extends BetterMap {
    constructor(mapManager) {
        super();

        this.map = mapManager;

        for (let [fileId, bookmarkIds] of this.map.account.get('map')) {
            if (Array.isArray(bookmarkIds)) {
                for (let bookmarkId of bookmarkIds) {
                    super.set(bookmarkId, fileId);
                }
            }
        }
    }

    delete(bookmarkId) {
        if (super.has(bookmarkId)) {
            let fileId = super.get(bookmarkId);
            super.delete(bookmarkId);

            if (this.map.files.has(fileId)) {
                let bookmarkIds = this.map.files.get(fileId);

                bookmarkIds.splice(bookmarkIds.indexOf(bookmarkId), 1);
            }
        }
    }
}