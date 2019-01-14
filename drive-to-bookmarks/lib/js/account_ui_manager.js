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

        this.setup();
    }

    setup(account = {}, el = document.body, check_children = true) {
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
                switch (target.getAttribute('account_ui_action')) {
                    case 'add':
                        this.account_manager.add();
                        break;

                    case 'remove':
                        if (account.id) {
                            this.account_manager.remove(account.id);
                            // this.labels_remove(account);
                        }
                        break;
                }
            });
        }

        this.account_manager.get_all()
        .then(accounts => {
            this.labels_add(accounts, el, check_children);
        });
    }

    update(details) {
        for (let action in details) {
            switch (action) {
                case 'add':
                    this.labels_add(details[action]);
                    break;
                case 'update':
                    this.labels_update(details[action]);
                    break;
                case 'remove':
                    this.labels_remove(details[action]);
                    break;
            }
        }
    }

    labels_add(accounts, el = document.body, check_children = true) {
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

                this.setup(account, label);

                this.labels_update(account, label);

                list.appendChild(label);
            }
        }
    }

    labels_update(accounts, el = document.body, check_children = true) {
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

    labels_remove(accounts, el = document.body, check_children = true) {
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