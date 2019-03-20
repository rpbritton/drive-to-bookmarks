export default class FileMapAPI {
    constructor(map = []) {
        this.files = new Map();
        this.bookmarks = new Map();

        for (let [fileId, bookmarkIds] of map) {
            this.files.set(fileId, new Set(bookmarkIds));

            for (let bookmarkId of bookmarkIds) {
                this.bookmarks.set(bookmarkId, fileId);
            }
        }
    }
    
    getFile(fileId) {
        return this.files.get(fileId);
    }

    getBookmark(bookmarkId) {
        return this.bookmarks.get(bookmark);
    }

    getAllFiles() {
        return [...this.files.keys()];
    }

    getAllBookmarks() {
        return [...this.bookmarks.keys()];
    }

    set(fileId, bookmarkId) {
        if (!this.files.has(fileId)) {
            this.files.set(fileId, new Set());
        }
        this.files.get(fileId).add(bookmarkId);

        this.bookmarks.set(bookmarkId, fileId);
    }

    removeFile(fileId) {
        if (this.files.has(fileId)) {
            for (let bookmarkId of this.files.get(fileId)) {
                this.bookmarks.delete(bookmarkId);
            }
            this.files.delete(fileId);
        }
    }

    removeBookmark(bookmarkId) {
        if (this.bookmarks.has(bookmarkId)) {
            this.files.get(this.bookmarks.get(bookmarkId)).delete(bookmarkId);
            this.bookmarks.delete(bookmarkId);
        }
    }

    save() {
        let map = [];

        for (let [fileId, bookmarkIds] of this.files) {
            let bookmarks = [];
            for (let bookmarkId of bookmarkIds) {
                bookmarks.push(bookmarkId);
            }

            map.push([fileId, bookmarks]);
        }

        return map;
    }

    // mapGetBookmark(bookmarkId) {
    //     return this.get('map').bookmark[bookmarkId];
    // }

    // mapGetFile(fileId) {
    //     return this.get('map').file[fileId];
    // }

    // mapGetAllBookmarks() {
    //     return Object.keys(this.get('map').bookmark);
    // }

    // mapGetAllFiles() {
    //     return Object.keys(this.get('map').file);
    // }

    // mapSet(fileId, bookmarkId, notifyUpdate = false) {
    //     if (fileId && bookmarkId) {
    //         let map = this.get('map');

    //         map.bookmark[bookmarkId] = fileId;

    //         if (!map.file[fileId]) {
    //             map.file[fileId] = {};
    //         }
    //         map.file[fileId][bookmarkId] = undefined;


    //         if (notifyUpdate) {
    //             AccountManager.refresh(this);
    //         }
    //     }
    // }

    // mapRemoveBookmark(bookmarkId = -1, notifyUpdate = false) {
    //     let map = this.get('map');

    //     if (map.bookmark.hasOwnProperty(bookmarkId)) {
    //         if (map.file[map.bookmarks[bookmarkId]]) {
                
    //         }

    //         delete map.file[map.bookmark[bookmarkId]];
    //         delete map.bookmark[bookmarkId];

    //         if (notifyUpdate) {
    //             AccountManager.refresh(this);
    //         }
    //     }
    // }

    // mapRemoveFile(fileId, notifyUpdate = false) {
    //     let map = this.get('map');

    //     if (fileId && map.file.hasOwnProperty(fileId)) {
    //         delete map.bookmark[map.file[fileId]];
    //         delete map.file[fileId];

    //         if (notifyUpdate) {
    //             AccountManager.refresh(this);
    //         }
    //     }
    // }
}