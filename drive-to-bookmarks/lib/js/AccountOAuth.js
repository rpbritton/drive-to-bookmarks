import XHR from './XHR.js'
import AccountStorageAPI from './AccountStorage.js'

const PROVIDERS = {
    'google': {
        'new': `https://accounts.google.com/o/oauth2/auth`
            +`?response_type=token`
            +`&client_id=${encodeURIComponent(chrome.runtime.getManifest().oauth2.client_id)}`
            +`&scope=${encodeURIComponent(chrome.runtime.getManifest().oauth2.scopes.join(' '))}`
            +`&redirect_uri=${chrome.identity.getRedirectURL('oauth2')}`,
        'info': 'https://www.googleapis.com/oauth2/v1/userinfo?access_token=',
        'remove': 'https://accounts.google.com/o/oauth2/revoke?token='
    }
};

export default class AccountOAuth {
    static add(provider) {
        return new Promise((resolve, reject) => {
            AccountOAuth.getNewToken(provider, {
                'interactive': true
            })
            .then(oauth => {
                return Promise.all([
                    oauth,
                    XHR('GET', `${PROVIDERS[provider]['info']}${oauth.token}`)
                ]);
            })
            .then(([oauth, info]) => {
                let account = {
                    'id': info.id,
                    'provider': provider,
                    'oauth': oauth,
                    'info': info
                }

                resolve(account);
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not add new account'));
            });
        });
    }

    static get(accountID, source) {
        return new Promise((resolve, reject) => {
            AccountOAuth.getToken({
                'accountID': accountID
            })
            .then(oauth => {
                return XHR('GET', `${PROVIDERS[provider][source]}${oauth.token}`);
            })
            .then(result => {
                resolve(result);
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not get that'));
            });
        });
    }

    static getToken({
        accountID = null,
        interactive = false
    } = {}) {
        return new Promise((resolve, reject) => {
            AccountStorage.get(accountID)
            .then(account => {
                if (account.tokenExpiration > Date.now()) {
                    resolve(account.token);
                }
                else {
                    AccountOAuth.getNewToken(account.provider, {
                        'accountID': accountID,
                        'interactive': interactive
                    })
                    .then(oauth => {
                        return Promise.all([
                            oauth,
                            AccountStorage.update(accountID, oauth)
                        ]);
                    })
                    .then(result => {
                        resolve(result[0]);
                    })
                    .catch(e => {
                        console.error(e);
                        reject(Error('Could not get (new) token'));
                    });
                }
            })
            .catch(e => {
                console.error(e);
                reject(Error('Could not get token'));
            })
        });
    }

    static getNewToken(provider, {
        accountID = null,
        interactive = false
    } = {}) {
        return new Promise((resolve, reject) => {
            let url = PROVIDERS[provider]['new'];
            if (accountID) {
                url += `&login_hint=${accountID}`;
            }
            else {
                url += `&prompt=select_account`;
            }

            chrome.identity.launchWebAuthFlow({
                'interactive': interactive,
                'url': url
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(Error(chrome.runtime.lastError));
                    return;
                }

                let params = {};
                for (let raw_param of response.split('#')[1].split('&')) {
                    let split_param = raw_param.split('=');
                    params[split_param[0]] = split_param[1];
                }

                resolve({
                    'token': params.access_token,
                    'tokenExpiration': Date.now() + params.expires_in * 1000 - 60000
                });
            });
        });
    }
}