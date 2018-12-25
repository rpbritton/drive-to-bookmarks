/* Modules. */
import * as account_manager from './account_manager.js'

export class AccountUIManager {
    constructor() {
        this.port = chrome.extension.connect({
            name: 'account_ui_manager'
        });
        port.onMessage.addListener(msg => {
            console.log('and here we are!');
        });
        port.postMessage('I\'m alive');
    }

    update(accounts) {
        for (let label_i = 0; label_i < this.labels.length; label_i++) {
            let account_i = accounts.findIndex(test_account => {
                return (test_account.id == this.labels[label_i].id);
            });

            /* Label is found in accounts, update it. */
            if (account_i > -1) {
                update_label(this.labels[label_i], accounts[account_i]);

                accounts.splice(account_i, 1);
            }
            /* Label is not found in accounts, remove it. */
            else {
                this.labels[label_i].el.remove();

                this.labels.splice(label_i, 1);

                label_i--;
            }
        }

        /* Add left over accounts not found in labels. */
        for (let account of accounts) {
            let label = {
                'el': this.template.content.cloneNode(true),
                'id': account.id
            }

            init_label(label, account);

            this.container.appendChild(label.el)
            label.el = this.container.lastElementChild;

            this.labels.push(label);
        }
    }
}

function init_label(label, account) {
    for (let el of label.el.querySelectorAll('[account_label_event]')) {
        let value = el.getAttribute('account_label_event');

        el.addEventListener(value, event => {
            switch (el.getAttribute('account_label_action')) {
                case 'remove':
                    account_manager.remove(account.id);
                    break;
            }
        });
    }

    update_label(label, account);
}

function update_label(label, account) {
    for (let el of label.el.querySelectorAll('[account_label_text]')) {
        let value = el.getAttribute('account_label_text');

        if (el.textContent != account[value]) {
            el.textContent = account[value];
        }
    }
}