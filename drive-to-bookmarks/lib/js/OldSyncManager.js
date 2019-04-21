
import AccountManager from './AccountManager.js'

export default class SyncManager {
    constructor(account) {
        this.account = account;

        if (!Array.isArray(this.account.get('nodes'))) {
            this.account.set('nodes', []);
        }
        this.nodes = this.account.get('nodes');

        this.map = {
            file: new Map(),
            bookmark: new Map()
        };

        for (let node of this.nodes) {
            this.map.file.set(node.id, node);

            for (let bookmarkId of node.linkBookmarks) {
                this.map.bookmark.set(bookmarkId, node);
            }
            if (node.isFolder) {
                for (let bookmarkId of node.folderbookmarks) {
                    this.map.bookmark.set(bookmarkId, file);
                }
            }
        }
    }
    
    full() {
        return new Promise((resolve, reject) => {
            Promise.all([
                this.account.bookmarks.getAll(),
                this.account.files.getAll()
            ])
            .then(([bookmarks, files]) => {
                // // Don't process the root folder
                // let rootFileId = this.account.get('rootFileId');
                // for (let bookmarkId of this.map.getFile(rootFileId)) {
                //     bookmarks.delete(bookmarkId);
                // }

                console.log(bookmarks);
                console.log(files);
                // console.log(this.map.getAllFiles());
                // console.log(this.map.getAllBookmarks());

                // Check for similarities
                for (let node of this.nodes) {
                    if (files.has(node.id)) {
                        Object.assign(node, files.get(node.id));
                        files.delete(node.id);

                        // Update the bookmarks
                        // this.account.bookmarks.update(this.map.file.get(fileId));

                        // let file = files.get(fileId);

                        // for (let bookmarkId of this.map.getFile(fileId)) {
                        //     file.bookmarkId = bookmarkId;
                        //     this.account.bookmarks.update(file);
                        // }

                        // files.delete(fileId);
                        // for (let bookmarkId of this.map.getFile(fileId)) {
                        //     bookmarks.delete(bookmarkId);
                        // }
                    }
                    else if (node.id != this.account.get('rootFileId')) {
                        // for (let bookmarkId of node.linkBookmarks) {
                        //     this.map.bookmark.delete(bookmarkId);
                        // }
                        // if (node.isFolder) {
                        //     for (let bookmarkId of node.folderBookmarks) {
                        //         this.map.bookmark.delete(bookmarkId);
                        //     }
                        // }

                        this.map.file.delete(node.id);
                        this.nodes.splice(this.nodes.indexOf(node), 1);

                        // // Remove the file if it doesn't exist in the drive
                        // for (let bookmarkId of this.map.getFile(fileId)) {
                        //     this.account.bookmarks.remove(bookmarkId);
                        // }
                        // this.map.removeFile(fileId);
                    }
                }

                for (let [fileId, file] of files) {
                    file.linkBookmarks = [];
                    if (file.isFolder) {
                        file.folderBookmarks = [];
                    }

                    this.nodes.push(file);

                    this.map.file.set(fileId, file);
                }

                let nodesToCheck = new Set(this.nodes);

                let checkNode = node => {
                    nodesToCheck.delete(node);

                    let promises = [];

                    for (let parentId of node.parents) {
                        let parentNode = this.map.file.get(parentId);
                        if (nodesToCheck.has(parentNode)) {
                            promises.push(checkNode(parentNode));
                        }
                    }

                    Promise.all(promises)
                    .then(() => {
                        this.account.bookmarks.update(node);
                    });
                }
                
                for (let node of nodesToCheck) {
                    checkNode(node);
                }

                // // Function to allow a recursive bookmark tree building
                // let createBookmarks = possibleParents => {
                //     return new Promise((resolve, reject) => {
                //         let promises = [];
                //         let possibleNewParents = new Set();

                //         // Move through files to be added, checking each parent
                //         for (let [fileId, file] of files) {
                //             if (file.fileParentIds.size == 0) {
                //                 files.delete(fileId);
                //                 continue;
                //             }

                //             for (let fileParentId of file.fileParentIds) {
                //                 if (possibleParents.has(fileParentId)) {
                //                     for (let bookmarkParentId of this.map.getFile(fileParentId)) {
                //                         file.bookmarkParentId = bookmarkParentId;

                //                         promises.push(
                //                             this.account.bookmarks.create(file)
                //                             .then(bookmark => {
                //                                 this.map.set(fileId, bookmark.bookmarkId);

                //                                 file.fileParentIds.delete(fileParentId);

                //                                 if (bookmark.isFolder) {
                //                                     possibleNewParents.add(fileId);
                //                                 }
                                                
                //                                 return Promise.resolve();
                //                             })
                //                         );
                //                     }
                //                 }
                //             }
                //         }

                //         Promise.all(promises)
                //         .then(() => {
                //             if (possibleNewParents.size != 0) {
                //                 createBookmarks(possibleNewParents)
                //                 .then(() => {
                //                     resolve();
                //                 });
                //             }
                //             else {
                //                 resolve();
                //             }
                //         });
                //     });
                // }
                // createBookmarks(this.map.getAllFiles())
                // .then(() => {
                //     AccountManager.refresh(this.account);
                // });

                // for (let [bookmarkId, bookmark] of bookmarks) {
                //     this.account.bookmarks.remove(bookmarkId);
                // }
            });
        });
    }

    // save() {
    //     this.account.set('map', this.map.save());
    // }
}
