import Account from './Account.js'

const GOOGLE_ACCOUNT_URLS = {
    'new': `https://accounts.google.com/o/oauth2/auth`
        +`?response_type=token`
        +`&client_id=${encodeURIComponent(chrome.runtime.getManifest().oauth2.client_id)}`
        +`&scope=${encodeURIComponent(chrome.runtime.getManifest().oauth2.scopes.join(' '))}`
        +`&redirect_uri=${chrome.identity.getRedirectURL('oauth2')}`,
    'profile': {
        'base': 'https://www.googleapis.com/oauth2/v1/userinfo',
        'token': 'access_token'
    },
    'remove': {
        'base': 'https://accounts.google.com/o/oauth2/revoke',
        'token': 'token'
    },
    'cloud': {
        'base': 'https://www.googleapis.com/drive/v3/files',
        'token': 'access_token',
        'files': `q=trashed = false&fields=nextPageToken,files(name,id,parents,webViewLink,mimeType)`,
        'folders': `q=trashed = false and mimeType contains 'application/vnd.google-apps.folder'&fields=nextPageToken,files(name,id,parents,webViewLink)`
    }
};

export default class GoogleAccount extends Account {
    constructor(account) {
        super(account);

        this.urls = GOOGLE_ACCOUNT_URLS;

        this.set({
            'provider': 'google'
        }, false);
    }
}