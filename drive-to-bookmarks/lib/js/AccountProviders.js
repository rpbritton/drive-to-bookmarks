import GoogleAccount from './GoogleAccount.js'

const PROVIDERS = {
    google: GoogleAccount
};

export default class AccountProviders {
    static get(provider) {
        if (provider) {
            return PROVIDERS[provider.toLowerCase()];
        }
        else {
            return PROVIDERS;
        }
    }
}