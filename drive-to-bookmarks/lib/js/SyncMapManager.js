export default class SyncMapManager {
    constructor(map = []) {
        this.files = new Map();
        this.bookmarks = new Map();

        for (let [file, bookmarks] of map) {
            this.files.set(file, new Set(bookmarks));

            for (let bookmark of bookmarks) {
                this.bookmarks.set(bookmark, file);
            }
        }
    }
    
    getFile(file) {
        return this.files.get(file);
    }

    getBookmark(bookmark) {
        return this.bookmarks.get(bookmark);
    }

    getAllFiles() {
        return new Set([...this.files.keys()]);
    }

    getAllBookmarks() {
        return new Set([...this.bookmarks.keys()]);
    }

    hasFile(file) {
        return this.files.has(file);
    }

    hasBookmark(bookmark) {
        return this.bookmark.has(bookmark);
    }

    set(file, bookmark) {
        if (!this.files.has(file)) {
            this.files.set(file, new Set());
        }
        this.files.get(file).add(bookmark);

        this.bookmarks.set(bookmark, file);
    }

    removeFile(file) {
        if (this.files.has(file)) {
            for (let bookmark of this.files.get(file)) {
                this.bookmarks.delete(bookmark);
            }
            this.files.delete(file);
        }
    }

    removeBookmark(bookmark) {
        if (this.bookmarks.has(bookmark)) {
            this.files.get(this.bookmarks.get(bookmark)).delete(bookmark);
            this.bookmarks.delete(bookmark);
        }
    }

    save() {
        let map = [];

        for (let [file, bookmarks] of this.files) {
            map.push([file, [...bookmarks]]);
        }

        return map;
    }
}