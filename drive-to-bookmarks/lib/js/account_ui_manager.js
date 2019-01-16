/*
 * Simple ui manager class.
 */
export class AccountUIManager {
    /*
     * Initial setup for the ui.
     */
    constructor() {
        this.account_manager = chrome.extension.getBackgroundPage().account_manager;

        this.prev_accounts = [];

        this.account_manager.get_all()
        .then(accounts => {
            this.prev_accounts = accounts;
            this._init();
        });
    }

    update(accounts) {
        for (let account_i in accounts) {
            let prev_account_i = this.prev_accounts.findIndex(test_prev_account => {
                return (test_prev_account.id == accounts[account_i].id);
            });

            if (prev_account_i > -1) {
                this._labels_update(accounts[account_i]);
                this.prev_accounts.splice(prev_account_i, 1);
            }
            else {
                this._labels_add(accounts[account_i]);
            }
        }

        this._labels_remove(this.prev_accounts);

        this.prev_accounts = accounts;
    }

    _init(account = {}, el = document.body, check_children = true) {
        let targets = [];
        if (check_children) {
            targets = Array.prototype.slice.call(
                                el.querySelectorAll('[account_ui_event]'));
        }
        if (el.getAttribute('account_ui_event')) {
            targets.push(el);
        }

        for (let target of targets) {
            target.addEventListener(target.getAttribute('account_ui_event'), event => {
                /* TODO: SMOOTH THIS OUT WITH THE BOTTOM THING. */
                switch (target.getAttribute('account_ui_action')) {
                    case 'add':
                        this.account_manager.add();
                        break;

                    case 'remove':
                        if (account.id) {
                            this.account_manager.remove(account.id);
                        }
                        break;
                }

                // let action;

                // switch (target.getAttribute('account_ui_action')) {
                //     case 'add': action = this.account_manager.add; break;
                //     case 'remove': action = this.account_manager.remove; break;
                // }

                // if (action) {
                //     action(account)
                //     .then(result => {
                //         console.log('yay it finished');
                //     });
                // }
            });
        }

        this._labels_add(this.prev_accounts, el, check_children);
    }

    _labels_add(accounts, el = document.body, check_children = true) {
        if (!Array.isArray(accounts)) {
            accounts = [accounts];
        }

        let lists = [];
        if (check_children) {
            lists = el.querySelectorAll('[account_ui_list]');
            lists = Array.prototype.slice.call(lists);
        }
        if (el.getAttribute('account_ui_list')) {
            lists.push(el);
        }

        for (let list of lists) {
            let template = list.querySelector('[account_ui_label_template]');
            for (let account of accounts) {
                let label = template.content.cloneNode(true).firstElementChild;

                label.setAttribute('account_ui_label_id', account.id);

                this._init(account, label);

                this._labels_update(account, label);

                list.appendChild(label);
            }
        }
    }

    _labels_update(accounts, el = document.body, check_children = true) {
        if (!Array.isArray(accounts)) {
            accounts = [accounts];
        }

        for (let account of accounts) {
            let labels = [];
            if (check_children) {
                labels = el.querySelectorAll(`[account_ui_label_id='${account.id}']`);
                labels = Array.prototype.slice.call(labels);
            }
            if (el.getAttribute('account_ui_label_id') == account.id) {
                labels.push(el);
            }

            for (let label of labels) {
                for (let target of label.querySelectorAll('[account_ui_text]')) {
                    target.innerHTML = account[target.getAttribute('account_ui_text')];
                }
            }
        }
    }

    _labels_remove(accounts, el = document.body, check_children = true) {
        if (!Array.isArray(accounts)) {
            accounts = [accounts];
        }

        for (let account of accounts) {
            let labels = [];
            if (check_children) {
                labels = el.querySelectorAll(`[account_ui_label_id='${account.id}']`);
                labels = Array.prototype.slice.call(labels);
            }
            if (el.getAttribute('account_ui_label_id') == account.id) {
                labels.push(el);
            }

            for (let label of labels) {
                label.remove();
            }
        }
    }
}