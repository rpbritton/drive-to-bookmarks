import SyncListManager from "./SyncListManager.js";

export default class SyncManager {
    constructor(account) {
        this.account = account;

        this.list = new SyncListManager(account);
    }

    full() {
        let newFileIds = this.account.files.list.getAll();

        for (let fileId of this.list.files.getAll()) {
            if (newFileIds.has(fileId)) {
                newFileIds.delete(fileId);
            }
            else {
                this.list.files.delete(fileId);
            }
        }

        for (let fileId of newFileIds) {
            this.list.files.set(fileId);
        }

        this.account.bookmarks.sync(this.list.files.getAll());
    }

    save() {
        this.list.save();
    }
}