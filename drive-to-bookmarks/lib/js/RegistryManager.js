import RegistryFilesMap from "./RegistryFilesMap.js";
import RegistryBookmarksMap from "./RegistryBookmarksMap.js";

export default class RegistryManager {
    constructor(account) {
        this.account = account;

        let records = this.account.get('registry');

        if (!Array.isArray(records)) {
            this.account.set('registry', []);
            records = [];
        }

        this.files = new RegistryFilesMap(records, this);
        this.bookmarks = new RegistryBookmarksMap(records, this);
    }

    save() {
        this.account.set('registry', [...this.files.entries()]);
    }
}

