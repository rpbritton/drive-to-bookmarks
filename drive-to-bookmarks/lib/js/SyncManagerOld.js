
import AccountManager from './AccountManager.js'
import SyncMapManager from './SyncListManager.js/index.js';
import { exampleFiles } from './ExampleFiles.js';

export default class SyncManager {
    constructor(account) {
        this.account = account;

        this.map = new SyncMapManager(this.account);
    }
    
    full() {
        return new Promise((resolve, reject) => {
            this.account.files.getAll()
            .then(files => {
                // console.log(bookmarks);
                console.log(files);

                // // Add new nodes
                // this.map.add(files);

                // // Remove the extra, now non-existent nodes
                // for (let node of this.map.getAll()) {
                //     if (!files.has(node.id)) {
                //         this.map.remove(node);
                //     }
                // }

                console.log(this.map.getAll());

                // this.account.bookmarks.update(this.map.getAll())
                // .then(() => {
                //     AccountManager.refresh(this.account);
                // });

                // // Update found nodes and delete the old
                // for (let node of this.map.getAll()) {
                //     if (files.has(node.id)) {
                //         this.map.update(node, files.get(node.id));
                //         files.delete(node.id);
                //     }
                //     else if (node.id != this.account.get('rootFileId')) {
                //         this.map.remove(node);
                //     }
                // }

                // // Add missing nodes
                // for (let [fileId, file] of files) {
                //     this.map.add(file);
                // }

                // Remove missing parents
                // let nodesToCheck = new Set(this.map.getAll());
                // let checkNode = node => {
                //     nodesToCheck.delete(node);


                // }
                // for (let node of nodesToCheck) {
                //     checkNode(node);
                // }

                // Sync nodes with bookmarks
                // for (let node of this.nodes) {
                //     this.account.bookmarks.update(node);
                // }
                // this.account.bookmarks.updateAll(this.nodes);

                // let nodesToCheck = new Set(this.nodes);

                // let checkNode = node => {
                //     nodesToCheck.delete(node);

                //     let promises = [];

                //     for (let parentId of node.parents) {
                //         let parentNode = this.map.file.get(parentId);
                //         if (nodesToCheck.has(parentNode)) {
                //             promises.push(checkNode(parentNode));
                //         }
                //     }

                //     Promise.all(promises)
                //     .then(() => {
                //         this.account.bookmarks.update(node);
                //     });
                // }
                
                // for (let node of nodesToCheck) {
                //     checkNode(node);
                // }
            });
        });
    }
}
