export default class SyncMapManager {
    constructor(account) {
        this.account = account;

        let map = this.account.get('syncMap');

        if (!Array.isArray(map)) {
            this.account.set('syncMap', []);
            map = [];
        }

        this.files = new FileMap(map, this);
        this.bookmarks = new BookmarkMap(map, this);
    }

    save() {
        this.account.set('syncMap', [...this.files.entries()]);
    }
}

class BetterMap extends Map {
    getAll() { return new Set([...super.keys()]); }
}

class FileMap extends BetterMap {
    constructor(currentMap, manager) {
        super(currentMap);

        this.manager = manager;
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
            this.manager.bookmarks.set(bookmarkId, fileId);
        }
    }

    delete(fileId) {
        if (super.has(fileId)) {
            let bookmarkIds = super.get(fileId);
            super.delete(fileId);

            for (let bookmarkId of bookmarkIds) {
                this.manager.bookmarks.delete(bookmarkId);
            }
        }
    }
}

class BookmarkMap extends BetterMap {
    constructor(currentMap, manager) {
        super();

        for (let [fileId, bookmarkIds] of currentMap) {
            for (let bookmarkId of bookmarkIds) {
                super.set(bookmarkId, fileId);
            }
        }

        this.manager = manager;
    }

    set(bookmarkId, fileId) {
        if (!bookmarkId || !fileId) {
            return;
        }

        if (super.get(bookmarkId) != fileId) {
            this.delete(bookmarkId);
        }
        super.set(bookmarkId, fileId);

        if (!this.manager.files.has(fileId) || !this.manager.files.get(fileId).includes(bookmarkId)) {
            this.manager.files.set(fileId, bookmarkId);
        }
    }

    delete(bookmarkId) {
        if (super.has(bookmarkId)) {
            let fileId = super.get(bookmarkId);
            super.delete(bookmarkId);

            if (this.manager.files.has(fileId) && this.manager.files.get(fileId).includes(bookmarkId)) {
                let bookmarkIds = this.manager.files.get(fileId);

                bookmarkIds.splice(bookmarkIds.indexOf(bookmarkId), 1);
            }
        }
    }
}