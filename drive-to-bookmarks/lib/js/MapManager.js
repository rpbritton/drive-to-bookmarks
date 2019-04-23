export default class MapManager {
    constructor(account) {
        this.account = account;

        if (!Array.isArray(this.account.get('map'))) {
            this.account.set('map', []);
        }

        this.files = new FileMap(this);
        this.bookmarks = new BookmarkMap(this);
    }

    set(fileId, bookmarkId) {
        if (!fileId || !bookmarkId) {
            return;
        }

        if (Array.isArray(this.files.get(fileId))) {
            if (!this.files.get(fileId).includes(bookmarkId)) {
                this.files.get(fileId).push(bookmarkId);
            }
        }
        else {
            this.files.set(fileId, [bookmarkId]);
        }

        if (this.bookmarks.has(bookmarkId)) {
            this.bookmarks.delete(bookmarkId);
        }
        this.bookmarks.set(bookmarkId, fileId);
    }

    save() {
        this.account.set('map', [...this.files.entries()]);
    }
}

class BetterMap extends Map {
    getAll() {
        return [...super.keys()];
    }
}

class FileMap extends BetterMap {
    constructor(mapManager) {
        super();

        this.map = mapManager;

        for (let [fileId, bookmarkIds] of this.map.account.get('map')) {
            if (Array.isArray(bookmarkIds)) {
                super.set(fileId, bookmarkIds);
            }
            else {
                super.set(fileId, []);
            }
        }
    }

    add(fileId) {
        if (!super.has(fileId)) {
            super.set(fileId, []);
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