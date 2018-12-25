// TODO: Implement these saftey features.
// export function open() {
//     return new Promise((resolve, reject) => {

//     });
// }

// export function close() {
//     return new Promise((resolve, reject) => {

//     });
// }

/*
 * Returns the sought after keys.
 *
 * If only one key is sought the value of that key is returned.
 */
export function get(keys) {
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
export function set(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(keys, () => {
            resolve();
        });
    });
}
