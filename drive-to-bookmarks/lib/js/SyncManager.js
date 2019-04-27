import SyncMapManager from "./SyncMapManager.js";
import BookmarkManager from "./BookmarkManager.js";
import FileManager from "./FileManager.js";

export default class SyncManager {
    constructor(account) {
        this.account = account;

        this.map = new SyncMapManager(account);
        this.files = new FileManager(this);
        this.bookmarks = new BookmarkManager(this);
    }

    start() {
        this.files.start();
        this.bookmarks.start();
    }

    full() {
        // let newFileIds = this.account.files.list.getAll();

        // for (let fileId of this.list.files.getAll()) {
        //     if (newFileIds.has(fileId)) {
        //         newFileIds.delete(fileId);
        //     }
        //     else {
        //         this.list.files.delete(fileId);
        //     }
        // }

        // for (let fileId of newFileIds) {
        //     this.list.files.set(fileId);
        // }

        // this.account.bookmarks.sync(this.list.files.getAll());
    }

    save() {
        this.map.save();
    }
}