import RegistryFilesMap from "./BookmarkRegistryFileMap.js";
import RegistryBookmarksMap from "./BookmarkRegistryBookmarkMap.js";

export default class BookmarkRegistryManager {
    constructor(account) {
        this.account = account;

        let records = this.account.get('bookmarksRegistry');

        if (!Array.isArray(records)) {
            this.account.set('bookmarksRegistry', []);
            records = [];
        }

        this.files = new RegistryFilesMap(records, this);
        this.bookmarks = new RegistryBookmarksMap(records, this);
    }

    save() {
        this.account.set('bookmarksRegistry', [...this.files.entries()]);
    }
}

