/* Modules. */
import * as storage_manager from './storage_manager.js'

/*
 * Updates all nametags.
 */
export function update() {
    storage_manager.get_all_accounts()
    .then(account_ids => {
        let wrappers = document.getElementsByClassName('nametag_wrapper');
        
        for (let wrapper of wrappers) {
            update_wrapper(wrapper, account_ids);
        }
    });
}

/*
 * Updates a single wrapper.
 */
function update_wrapper(wrapper, account_ids) {
    for (let nametag of wrapper.children) {
        if (nametag.classList.contains('nametag')) {
            let account_id = nametag.getAttribute('account_id');

            if (account_ids.includes(account_id)) {
                update_nametag(nametag);

                account_ids.splice(account_ids.indexOf(account_id), 1);
            }
            else {
                nametag.remove();
            }
        }
    }

    for (let account_id of account_ids) {
        create_nametag(wrapper, account_id);
    }
}

/* 
 * Updates a nametag.
 */
function update_nametag(nametag) {
    storage_manager.get_account(nametag.getAttribute('account_id'))
    .then(account => {
        let picture = nametag.getElementsByClassName('nametag_picture')[0];
        picture.style.backgroundImage = `url(${account.picture})`;

        let name = nametag.getElementsByClassName('nametag_name')[0];
        name.innerHTML = account.name;

        let email = nametag.getElementsByClassName('nametag_email')[0];
        email.innerHTML = account.email;
    });
}

/*
 * Creates a new nametag.
 */
function create_nametag(wrapper, account_id) {
    storage_manager.get_account(account_id)
    .then(account => {
        /* Nametag. */
        let nametag = document.createElement('div');
        nametag.classList.add('nametag');
        nametag.setAttribute('account_id', account_id);

        /* Picture. */
        let picture = document.createElement('div');
        picture.classList.add('nametag_picture')
        picture.style.backgroundImage = `url(${account.picture})`;
        nametag.appendChild(picture);

        /* Name. */
        let name = document.createElement('span');
        name.classList.add('nametag_name');
        name.innerHTML = account.name;
        nametag.appendChild(name);

        /* Email. */
        let email = document.createElement('span');
        email.classList.add('nametag_email');
        email.innerHTML = account.email;
        nametag.appendChild(email);

        wrapper.appendChild(nametag);
    });
}
