
import SyncMapManager from './SyncMapManager.js'
import AccountManager from './AccountManager.js'

export default class SyncManager {
    constructor(account) {
        this.account = account;
        if (!this.account.get('map')) {
            this.account.set({'map': []});
        }
        this.map = new SyncMapManager(this.account.get('map'));
    }
    
    full() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.account.bookmarks.getAll(),
                this.account.files.getAll()
            ])
            .then(([bookmarks, files]) => {
                // Don't process the root folder
                let rootFolderId = this.account.get('rootFolderId');
                for (let bookmarkId of this.map.getFile(rootFolderId)) {
                    bookmarks.delete(bookmarkId);
                }

                // console.log(bookmarks);
                // console.log(files);
                // console.log(this.map.getAllFiles());
                // console.log(this.map.getAllBookmarks());

                // Check for similarities
                for (let fileId of this.map.getAllFiles()) {
                    if (files.has(fileId)) {
                    // Update the file if it already exists
                        let file = files.get(fileId);
                        file.bookmarkId = this.map.getFile(fileId);

                        for (let bookmarkId of this.map.getFile(fileId)) {
                            file.bookmarkId = bookmarkId;
                            this.account.bookmarks.update(file);
                        }

                        files.delete(fileId);
                        for (let bookmarkId of this.map.getFile(fileId)) {
                            bookmarks.delete(bookmarkId);
                        }
                    }
                    else if (fileId != rootFolderId) {
                    // Remove the file if it doesn't exist in the drive
                        for (let bookmarkId of this.map.getFile(fileId)) {
                            this.account.bookmarks.remove(bookmarkId);
                        }
                        this.map.removeFile(fileId);
                    }
                }

                // Function to allow a recursive bookmark tree building
                let createBookmarks = possibleParents => {
                    return new Promise((resolve, reject) => {
                        let promises = [];
                        let possibleNewParents = new Set();

                        // Move through files to be added, checking each parent
                        for (let [fileId, file] of files) {
                            if (file.fileParentIds.size == 0) {
                                files.delete(fileId);
                                continue;
                            }

                            for (let fileParentId of file.fileParentIds) {
                                if (possibleParents.has(fileParentId)) {
                                    for (let bookmarkParentId of this.map.getFile(fileParentId)) {
                                        file.bookmarkParentId = bookmarkParentId;

                                        promises.push(
                                            this.account.bookmarks.create(file)
                                            .then(bookmark => {
                                                this.map.set(fileId, bookmark.bookmarkId);

                                                file.fileParentIds.delete(fileParentId);

                                                if (bookmark.isFolder) {
                                                    possibleNewParents.add(fileId);
                                                }
                                                
                                                return Promise.resolve();
                                            })
                                        );
                                    }
                                }
                            }
                        }

                        Promise.all(promises)
                        .then(() => {
                            if (possibleNewParents.size != 0) {
                                createBookmarks(possibleNewParents)
                                .then(() => {
                                    resolve();
                                });
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                }
                createBookmarks(this.map.getAllFiles())
                .then(() => {
                    AccountManager.refresh(this.account);
                });

                for (let [bookmarkId, bookmark] of bookmarks) {
                    this.account.bookmarks.remove(bookmarkId);
                }
            });
        });
    }

    save() {
        this.account.set('map', this.map.save());
    }
}