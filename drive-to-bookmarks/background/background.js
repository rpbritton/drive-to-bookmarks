/* Modules. */
import AccountManager from '../lib/js/AccountManager.js'

AccountManager.reset()
.then(() => {
    for (let account of AccountManager.getAll()) {
        account.sync.full();
    }
});


