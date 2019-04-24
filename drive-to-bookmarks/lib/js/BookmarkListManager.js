export default class BookmarkListManager extends Map {
    constructor(account) {
        super();

        this.account = account;
    }

    getAll() {
        return new Set([...super.keys()]);
    }
}