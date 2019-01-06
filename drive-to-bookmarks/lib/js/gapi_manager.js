/* URLs used with the GoogleAPI. */
const gapi_urls = {
    /* URL used for interacting with user accounts. */
    'new_token': `https://accounts.google.com/o/oauth2/auth`
        +`?response_type=token`
        +`&client_id=${encodeURIComponent(chrome.runtime.getManifest().oauth2.client_id)}`
        +`&scope=${encodeURIComponent(chrome.runtime.getManifest().oauth2.scopes.join(' '))}`
        +`&redirect_uri=${chrome.identity.getRedirectURL('oauth2')}`,
    /* User info url for fetching name and profile image. */
    'userinfo': `https://www.googleapis.com/oauth2/v1/userinfo`,
    /* Drive API. */
    'drive': `https://www.googleapis.com/drive/v3`,
    /* Revoke url, used when removing a user account. */
    'revoke': `https://accounts.google.com/o/oauth2/revoke`
};

/*
 * Simple manager class for google api functions.
 */
export class GAPIManager {
    /*
    * Used to check a gapi token, fetching a new one if need be.
    *
    * If details.interactive is true it may prompt the user (if necessary).
    * If details.account is null it will try to add a new account.
    */
    get_token(details) {
        return new Promise((resolve, reject) => {
            /* Check if a new token is needed. */
            if (details.account) {
                if (details.account.token_expiration > Date.now() && !details.interactive) {
                    resolve(details.account);
                    return;
                }
            }

            /* Create the url (whether to hint at a user or not). */
            let url = gapi_urls.new_token;
            if (details.account) {
                url += `&login_hint=${details.account.id}`;
            }
            else {
                url += `&prompt=select_account`;
            }

            /* Go get a token. */
            chrome.identity.launchWebAuthFlow({
                'interactive': details.interactive,
                'url': url
            }, response => {
                /* oauth fail check. */
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    reject();
                    return;
                }

                /* Splits the response into url parameters. */
                let params = {};
                for (let raw_param of response.split('#')[1].split('&')) {
                    let split_param = raw_param.split('=');
                    params[split_param[0]] = split_param[1];
                }

                /* Make the account an object if it is not defined. */
                if (!details.account) {
                    details.account = {};
                }

                /* update token information. */
                details.account.token = params.access_token;
                details.account.token_expiration = Date.now() + params.expires_in * 1000 - 60000;

                /* Success, return the updated account. */
                resolve(details.account);
            });
        });
    }

    /*
    * Update basic account info, like picture and email, and the account's
    * root folder id.
    */
    update_info(account) {
        return new Promise((resolve, reject) => {
            this.get_token({
                'account': account,
                'interactive': false
            })
            .then(account => {
                return Promise.all([
                    account,
                    gapi_request(`${gapi_urls.userinfo}?access_token=${account.token}`),
                    gapi_request(`${gapi_urls.drive}/files/root?access_token=${account.token}`),
                ])
            })
            .then(result => {
                let [account, new_info, root_folder] = result;

                Object.assign(account, new_info);
                account.root_folder_id = root_folder.id;

                resolve(account);
            })
            .catch(error => {
                console.error('Could not update info');
                reject();
            });
        });
    }

    remove(account) {
        return new Promise((resolve, reject) => {
            this.get_token({
                'account': account,
                'interactive': false
            })
            .then(account => {
                return gapi_request(`${gapi_urls.revoke}?token=${account.token}`);
            })
            .then(result => {
                resolve();
            })
            .catch(error => {
                console.error('Could not revoke access');
                reject();
            });
        });
    }
}









// /*
//  * Opens up the google user account selector, allowing a user to be added.
//  */
// export function add_account() {
//     return new Promise((resolve, reject) => {
//         /* Launches the web authenticationer. */
//         get_new_token({
//             'interactive': true,
//             'url': `${url.account}&prompt=select_account`
//         })
//         .then(oauth => {
//             /* Fetch user info and root folder information. */
//             return Promise.all([
//                 gapi_request(`${url.userinfo}?access_token=${oauth.token}`),
//                 gapi_request(`${url.drive}/files/root?access_token=${oauth.token}`),
//                 oauth
//             ]);
//         })
//         .then(result => {
//             /* Data retrieved. */
//             let [account, root_folder, oauth] = result;

//             /* Including other info on the account. */
//             account.token = oauth.token;
//             account.token_expiration = Date.now() + oauth.expiration * 1000 - 60000;
//             account.root_id = root_folder.id;
//             // Is this needed?
//             // account.file_to_bookmark = {};

//             /* Save the account to storage. */
//             storage_manager.save_account(account.id, account)
//             .then(() => {
//                 resolve(account.id);
//             });
//         })
//         .catch(error => {
//             console.error('Adding user failed.');
//             reject();
//         });
//     });
// }

// /*
//  * Revokes the apps access and removes the account from storage
//  */
// export function remove_account(account_id) {
//     return new Promise((resolve, reject) => {
//         /* Retrieves the account token. */
//         get_token(account_id).then(token => {
//             /* Revokes the apps access. */
//             return Promise.all([
//                 get_request(`${revoke_url}?token=${token}`).catch(error => {
//                     console.error('Could not revoke token.');
//                 }),
//                 storage_manager.remove_account(account_id).catch(error => {
//                     console.error('Could not remove account from storage.')
//                 })
//             ]);
//         })
//         .then(() => {
//             resolve();
//         })
//         .catch(error => {
//             /* Could not get token. */
//             reject();
//         });
//     });
// }

// TODO: Is this all necessary?

// /*
//  * Fetches all of the files in an accounts drive as an object
//  */
// var get_all_files = function(account_id) {
//     return new Promise((resolve, reject) => {
//         storage.get_account(account_id)
//         .then(account => {
//             let files = {};
//             let url = `${drive_url}/files?pageSize=1000&fields=nextPageToken,files(name,id,mimeType,parents,webViewLink,trashed,starred)`;

//             function remove_parent(file_id, parent_id) {
//                 for (let i in files[file_id].parents) {
//                     if (files[file_id].parents[i] == parent_id) {
//                         files[file_id].parents = files[file_id].parents.splice(i, 1);
//                     }
//                 }

//                 if (!files[file_id].parents)
//                     delete files[file_id];
//             }

//             function sort() {
//                 for (let file_id in files) {
//                     if (files[file_id].parents) {
//                         remove_parent(file_id);

//                         if (!files[file_id].parents.length)
//                             delete files[i];
//                     }
//                     else {
//                         for (let i in files) {
//                             remove_parent(i, file_id);
//                         }
//                         delete files[file_id];
//                     }
//                 }

//                 resolve(files);
//             }

//             function get_page(next_page_token) {
//                 get_resource(account_id, `${url}${(next_page_token) ? `&pageToken=${next_page_token}` : ""}`)
//                 .then(response => {
//                     for (let i in response.files) {
//                         files[response.files[i].id] = response.files[i];
//                     }

//                     if (response.nextPageToken)
//                         get_page(response.nextPageToken);
//                     else
//                         sort();
//                 });
//             };
//             get_page();
//         });
//     });
// }

// /*
//  * Gets a resource from an account
//  */
// var get_resource = function(account_id, url) {
//     return new Promise((resolve, reject) => {
//         check_token(account_id)
//         .then(token => {
//             return get_request(`${url}&access_token=${token}`);
//         })
//         .then(response => {
//             resolve(response);
//         });
//     });
// }

// /*
//  * Gets the token from storage. It may need to get a new token if the current
//  * one has expired.
//  */
// function get_token(account_id) {
//     return new Promise((resolve, reject) => {
//         /* Fetches the account from storage. */
//         storage_manager.get_account(account_id)
//         .then(account => {
//             /* Checks if the oauth token is active. If so, returns it. */
//             if (Date.now() < account.token_expiration) {
//                 resolve(account.token);
//                 return;
//             }

//             /* Oauth token was not active, must get a new one. */
//             get_new_token({
//                 'url': `${accounts_url}&login_hint=${account_id}`,
//                 'interactive': false
//             })
//             .then(oauth => {
//                 /* New token successfully retrieved, save it. */
//                 return Promise.all([
//                     storage_manager.save_account(account.id, {
//                         'token': oauth.token,
//                         'token_expiration': oauth.expiration
//                     }),
//                     oauth.token
//                 ]);
//             })
//             .then(result => {
//                 /* Successfully saved, now returning the token. */
//                 resolve(result[1]);
//             })
//             .catch(error => {
//                 console.error('Failed to get a new token.');
//                 reject();
//             });
//         })
//         .catch(error => {
//             reject();
//         });
//     });
// }

// /*
//  * Fetches a new token, often used because the old one expired.
//  */
// function get_new_token(details) {
//     return new Promise((resolve, reject) => {
//         chrome.identity.launchWebAuthFlow(details, response => {
//             /* oauth fail check. */
//             if (chrome.runtime.lastError) {
//                 console.error(chrome.runtime.lastError.message);
//                 reject();
//                 return;
//             }

//             /* Splits the response into url parameters. */
//             let params = {};
//             for (let raw_param of response.split('#')[1].split('&')) {
//                 let split_param = raw_param.split('=');
//                 params[split_param[0]] = split_param[1];
//             }

//             /* Success, return the token and expiration. For saftey/delay
//             expiration returned as a minute less. */
//             resolve({
//                 'token': params.access_token,
//                 'expiration': Date.now() + params.expires_in * 1000 - 60000
//             });
//         });
//     });
// }

/*
 * Performs a get request
 */
function gapi_request(url) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    resolve(JSON.parse(xhr.responseText));
                }
                else if (xhr.status == 400 || xhr.status == 401) {
                    console.error('Account access was (likely) revoked.');
                    reject();
                }
                else {
                    reject();
                }
            }
        }

        xhr.onerror = () => {
            reject();
            return;
        };
    
        xhr.open("GET", url, true);
        xhr.send();
    });
}
