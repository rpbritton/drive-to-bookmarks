import AccountManager from './AccountManager.js'

export default class AccountUIManager {
    init() {
        AccountManager.changes.addEventListener('add', event => {
            _addAccount(event.detail);
        });
        AccountManager.changes.addEventListener('update', event => {
            _updateAccount(event.detail);
        });
        AccountManager.changes.addEventListener('remove', event => {
            _removeAccount(event.detail);
        });

        _initEl();
    }
}

function _initEl(account, el = document.body, checkChildren = true) {
    let targets = [];
    if (checkChildren) {
        targets = el.querySelectorAll('[account_ui_event]');
        targets = Array.prototype.slice.call(targets);
    }
    if (el.getAttribute('account_ui_event')) {
        targets.push(el);
    }

    for (let target of targets) {
        target.addEventListener(target.getAttribute('account_ui_event'), ev => {
            switch (target.getAttribute('account_ui_action')) {
                case 'add':
                    // AccountProviders['Google'].add();
                    AccountManager.addNew('Google');
                    break;

                case 'remove':
                    if (account) {
                        account.remove();
                    }
                    break;
            }
        });
    }

    _addAccount(AccountManager.getAll(), el, checkChildren);
}

function _addAccount(accounts, el = document.body, checkChildren = true) {
    if (!Array.isArray(accounts)) {
        accounts = [accounts];
    }

    let lists = [];
    if (checkChildren) {
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

            label.setAttribute('account_ui_label_id', account.get('id'));

            _initEl(account, label);

            _updateAccount(account, label);

            list.appendChild(label);
        }
    }
}

function _updateAccount(accounts, el = document.body, checkChildren = true) {
    if (!Array.isArray(accounts)) {
        accounts = [accounts];
    }

    for (let account of accounts) {
        let labels = [];
        if (checkChildren) {
            labels = el.querySelectorAll(`[account_ui_label_id='${account.get('id')}']`);
            labels = Array.prototype.slice.call(labels);
        }
        if (el.getAttribute('account_ui_label_id') == account.get('id')) {
            labels.push(el);
        }

        for (let label of labels) {
            for (let target of label.querySelectorAll('[account_ui_text]')) {
                target.innerHTML = account.get('profile')[target.getAttribute('account_ui_text')];
            }
        }
    }
}

function _removeAccount(accounts, el = document.body, checkChildren = true) {
    if (!Array.isArray(accounts)) {
        accounts = [accounts];
    }

    for (let account of accounts) {
        let labels = [];
        if (checkChildren) {
            labels = el.querySelectorAll(`[account_ui_label_id='${account.get('id')}']`);
            labels = Array.prototype.slice.call(labels);
        }
        if (el.getAttribute('account_ui_label_id') == account.get('id')) {
            labels.push(el);
        }

        for (let label of labels) {
            label.remove();
        }
    }
}