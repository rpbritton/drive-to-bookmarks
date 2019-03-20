import FileManager from './FileManager.js'
import BookmarkManager from './BookmarkManager.js'
import SyncMapManager from './SyncMapManager.js';

export default class SyncManager {
    constructor(account) {
        this.account = account;
        if (!this.account.get('map')) {
            this.account.set({'map': []});
        }
        this.map = new SyncMapManager(this.account.get('map'));

        this.files = new FileManager(this.account);
        this.bookmarks = new BookmarkManager(this.account);
    }
    
    full() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.bookmarks.getAll(),
                this.files.getAll()
            ])
            .then(([bookmarks, files]) => {
                // for (let bookmarkId of this.map.getFile('root')) {
                //     bookmarks.delete(bookmarkId);
                // }

                console.log(bookmarks);
                console.log(files);
                console.log(this.map.getAllFiles());
                console.log(this.map.getAllBookmarks());

                // for (let fileId of this.map.getAllFiles()) {
                //     if (files.has(fileId)) {
                //         // updateBookmark(fileId, files.get(fileId));

                //         files.delete(fileId);
                //         for (let bookmarkId of this.map.getFile(fileId)) {
                //             bookmarks.delete(bookmarkId);
                //         }
                //     }
                //     else if (fileId != 'root') {
                //         for (let bookmarkId of this.map.getFile(fileId)) {
                //             BookmarkAPI.remove(bookmarkId);
                //         }
                //         this.map.removeFile(fileId);
                //     }
                // }

                // let addBookmarks = []
                // for (let [fileId, file] of files) {
                //     if (file.parents) {
                //         for (let fileParentId of file.parents) {
                //             addBookmarks.push(BookmarkAPI.create({
                //                 parentId: this.map.getFile(fileParentId),
                //                 url: (file.url == 'application/vnd.google-apps.folder') ? null : file.url,
                //                 title: file.name
                //             })
                //             .then(bookmark => {
                //                 this.map.set(fileId, bookmark.id);

                //                 console.log('added');

                //                 return Promise.resolve();
                //             }));
                //         }
                //     }
                // }
                // Promise.all(addBookmarks)
                // .then(result => {
                //     // Save
                //     // Reorganize

                //     console.log(this.map);
                //     AccountManager.refresh(this);
                // });

                // for (let [bookmarkId, bookmark] of bookmarks) {
                //     // BookmarkAPI.remove(bookmarkId);
                // }
            });
        });
    }

    save() {
        this.account.set({map: this.map.save()});
    }
}