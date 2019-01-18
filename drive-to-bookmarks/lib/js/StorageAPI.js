export default class StorageAPI {
    static open() {

    }

    static close() {

    }

    static get(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, storage => {
                if (keys.constructor === Array) {
                    resolve(storage);
                }
                else {
                    resolve(storage[keys]);
                }
            });
        });
    }

    static set(object) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(object, () => {
                resolve();
            });
        });
    }

    static clear() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.clear(() => {
                resolve();
            })
        });
    }
}