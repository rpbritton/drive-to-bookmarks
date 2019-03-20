import XHR from './XHR.js'

export default class OAuth {
    constructor(account) {
        this.account = account;
    }

    get(source, params = []) {
        return new Promise((resolve, reject) => {
            let url = this.account.urls[source].base;

            // TODO THIS STUCKS
            if (!Array.isArray(params)) {
                params = [params];
            }

            getToken()
            .then(oauth => {
                params.push(`${this.account.urls[source].token}=${oauth.token}`);

                return XHR('GET', `${url}?${params.join('&')}`);
            })
            .then(result => {
                resolve(result);
            })
            .catch(e => {
                reject(Error('Could not get the url.'));
            })
        });
    }

    getToken(interactive = false) {
        return new Promise((resolve, reject) => {
            if (this.account.get('oauth').tokenExpiration > Date.now()) {
                resolve(this.account.get('oauth'));
            }
            else {
                OAuth.getNewToken(account, {interactive: interactive})
                .then(oauth => {
                    resolve(oauth);
                })
                .catch(e => {
                    console.error(e);
                    reject(Error('Could not get (new) token'));
                });
            }
        });
    }

    getNewToken({
        interactive = false,
        updateAccount = true
    } = {}) {
        return new Promise((resolve, reject) => {
            let url = this.account.urls.new;
            if (this.account.get('id')) {
                url += `&login_hint=${this.account.get('id')}`;
            }
            else {
                url += `&prompt=select_account`;
            }

            chrome.identity.launchWebAuthFlow({
                'url': url,
                'interactive': interactive
            }, response => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    reject(Error(chrome.runtime.lastError));
                    return;
                }

                let params = {};
                for (let raw_param of response.split('#')[1].split('&')) {
                    let split_param = raw_param.split('=');
                    params[split_param[0]] = split_param[1];
                }

                let oauth = {
                    'token': params.access_token,
                    'tokenExpiration': Date.now() + params.expires_in * 1000 - 60000
                };

                if (updateAccount) {
                    this.account.set({
                        'oauth': oauth
                    });
                }

                resolve(oauth);
            });
        });
    }
}