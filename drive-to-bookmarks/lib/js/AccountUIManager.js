import { GetAccountManager } from './AccountManager.js'

export default class AccountUIManager {
    constructor() {
        GetAccountManager().changeEmitter.addEventListener('add', event => {
            add(event.detail);
        });
        GetAccountManager().changeEmitter.addEventListener('update', event => {
            update(event.detail);
        });
        GetAccountManager().changeEmitter.addEventListener('remove', event => {
            remove(event.detail);
        });

        init();
    }
}

function init(account = {}, el = document.body, checkChildren = true) {
    let targets = [];
    if (checkChildren) {
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
                    GetAccountManager().add('Google');
                    break;

                case 'remove':
                    if (account.id) {
                        GetAccountManager().remove(account.id);
                    }
                    break;
            }
        });
    }

    GetAccountManager().getAll()
    .then(accounts => {
        add(accounts, el, checkChildren);
    });
}

function add(accounts, el = document.body, checkChildren = true) {
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

            label.setAttribute('account_ui_label_id', account.id);

            init(account, label);

            update(account, label);

            list.appendChild(label);
        }
    }
}

function update(accounts, el = document.body, checkChildren = true) {
    if (!Array.isArray(accounts)) {
        accounts = [accounts];
    }

    for (let account of accounts) {
        let labels = [];
        if (checkChildren) {
            labels = el.querySelectorAll(`[account_ui_label_id='${account.id}']`);
            labels = Array.prototype.slice.call(labels);
        }
        if (el.getAttribute('account_ui_label_id') == account.id) {
            labels.push(el);
        }

        for (let label of labels) {
            for (let target of label.querySelectorAll('[account_ui_text]')) {
                target.innerHTML = account.info[target.getAttribute('account_ui_text')];
            }
        }
    }
}

function remove(accounts, el = document.body, checkChildren = true) {
    if (!Array.isArray(accounts)) {
        accounts = [accounts];
    }

    for (let account of accounts) {
        let labels = [];
        if (checkChildren) {
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