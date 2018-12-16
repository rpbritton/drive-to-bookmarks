/* Modules. */
import * as gapi_manager from './gapi_manager.js'
import * as storage_manager from './storage_manager.js'

/*
 * Add an account, first through gapi then to storage.
 */
export function add() {
    return new Promise((resolve, reject) => {
        gapi_manager.add()
        .then(account => {
        })
        .catch();
    });
}

/*
 * Get new account info based off the account id.
 */
export function get_new(account_id) {

}

/*
 * Get account info based off the account id.
 */
export function get(account_id) {

}

/*
 * Get all the stored accounts.
 */
export function get_all() {

}

/*
 * Remove an account from storage and revoke access.
 */
export function remove(account_id) {

}