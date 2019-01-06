/*
 * Simple storage manager, should only have one "open"
 */
export class StorageManager {
    // TODO: Implement these saftey features.
    // open() {
    //     return new Promise((resolve, reject) => {

    //     });
    // }

    // close() {
    //     return new Promise((resolve, reject) => {

    //     });
    // }

    /*
    * Returns the sought after keys.
    *
    * If only one key is sought the value of that key is returned.
    */
    get(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, storage => {
                /* Return object vs value of a single key. */
                if (keys.constructor === Array) {
                    resolve(storage);
                }
                else {
                    resolve(storage[keys]);
                }
            });
        });
    }

    /*
    * Overwrites the given keys in storage.
    */
    set(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(keys, () => {
                resolve();
            });
        });
    }
}