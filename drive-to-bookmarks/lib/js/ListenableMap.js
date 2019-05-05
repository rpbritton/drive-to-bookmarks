export default class ListenableMap extends Map {
    constructor() {
        super();

        this.listeners = new Set();
    }

    addListener(listener) {
        this.listeners.add(listener);
    }

    getAll() {
        return new Set([...super.keys()]);
    }

    delete(key) {
        let oldVal = super.get(key);
        super.delete(key);

        if (oldVal) {
            notify('remove', key, oldVal);
        }
    }

    notify(command, key, oldVal) {
        for (let listener of this.listeners) {
            if (typeof listener[command] === 'function') {
                listener[command](key, super.get(key), oldVal);
            }
        }
    }

    removeListener(listener) {
        this.listeners.remove(listener);
    }

    set(key, val) {
        let oldVal = super.get(key);
        super.set(key, val);

        if (oldVal) {
            notify('update', key, oldVal);
        }
        else {
            notify('add', key);
        }

    }
}