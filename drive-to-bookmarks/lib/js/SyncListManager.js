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
    getAll() { return new Set([...super.keys()]); }
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
        if (!fileId) {
            return;
        }

        if (!super.has(fileId)) {
            super.set(fileId, []);
        }

        if (!!bookmarkId && !super.get(fileId).includes(bookmarkId)) {
            super.get(fileId).push(bookmarkId);
            this.account.sync.list.bookmarks.set(bookmarkId, fileId);
        }
    }

    delete(fileId) {
        if (super.has(fileId)) {
            let bookmarkIds = super.get(fileId);
            super.delete(fileId);

            for (let bookmarkId of bookmarkIds) {
                this.account.sync.list.bookmarks.delete(bookmarkId);
            }
        }
    }
}

class BookmarkMap extends BetterMap {
    constructor(account) {
        super();

        this.account = account;

        for (let [fileId, bookmarkIds] of this.account.get('syncMap')) {
            if (Array.isArray(bookmarkIds)) {
                for (let bookmarkId of bookmarkIds) {
                    super.set(bookmarkId, fileId);
                }
            }
        }
    }

    set(bookmarkId, fileId) {
        // if (super.has(bookmarkId)) {
        //     this.delete(bookmarkId);
        // }
        super.set(bookmarkId, fileId);

        // let fileBookmarkIds = this.account.sync.list.files.get(fileId);
        if (!this.account.sync.list.files.has(fileId) || !this.account.sync.list.files.get(fileId).includes(bookmarkId)) {
            this.account.sync.list.files.set(fileId, bookmarkId);
        }
    }

    delete(bookmarkId) {
        if (super.has(bookmarkId)) {
            let fileId = super.get(bookmarkId);
            super.delete(bookmarkId);

            if (this.account.sync.list.files.has(fileId)) {
                let bookmarkIds = this.account.sync.list.files.get(fileId);

                bookmarkIds.splice(bookmarkIds.indexOf(bookmarkId), 1);
            }
        }
    }
}