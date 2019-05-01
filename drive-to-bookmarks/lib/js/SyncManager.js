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

    fullFileSync() {
        let newFileIds = this.files.getAll();

        for (let fileId of this.map.files.getAll()) {
            if (newFileIds.has(fileId)) {
                newFileIds.delete(fileId);
            }
            else {
                this.map.files.delete(fileId);
            }
        }

        for (let fileId of newFileIds) {
            this.map.files.set(fileId);
        }
    }

    fullBookmarkSync() {
        let fileIdsToUpdate = this.files.getAll();

        let syncBookmark = fileId => {
            fileIdsToUpdate.delete(fileId);

            let file = this.files.get(fileId);

            // Gather parent bookmarks (and update them if need be)
            let promisesOfParentUpdates = [];
            for (let parentId of file.parents) {
                if (fileIdsToUpdate.has(parentId)) {
                    promisesOfParentUpdates.push(syncBookmark(parentId));
                }
            }

            return Promise.all(promisesOfParentUpdates)
            .then(() => {
                return this.bookmarks.update(fileId);
            })
            .then(arraysOfBookmarks => {
                let bookmarks = arraysOfBookmarks.flat();

                for (let bookmark of bookmarks) {
                    this.map.bookmarks.set(bookmark.id, fileId);
                }

                return Promise.resolve();
            });
        }

        let syncBookmarks = () => {
            if (fileIdsToUpdate.size == 0) {
                return Promise.resolve();
            }

            return syncBookmark(fileIdsToUpdate.values().next().value)
            .then(() => {
                return syncBookmarks();
            });
        }
        return syncBookmarks();
        // SHOULD I DELETE EXCESS BOOKMARKS NOW?
    }

    save() {
        this.map.save();
    }
}