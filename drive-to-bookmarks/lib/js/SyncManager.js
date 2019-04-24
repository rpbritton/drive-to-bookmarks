import SyncListManager from "./SyncListManager";

export default class SyncManager {
    constructor(account) {
        this.account = account;

        this.list = new SyncListManager(account);
    }

    refresh() {
        let newFileIds = this.account.files.getAll();

        for (let fileId of this.list.files.getAll()) {
            if (newFileIds.has(fileId)) {
                newFileIds.delete(fileId);
            }
            else {
                this.list.files.delete(fileId);
            }
        }

        for (let fileId of newFileIds) {
            this.list.files.add(fileId);
        }

        this.account.bookmarks.sync();
    }

    save() {
        this.list.save();
    }
}