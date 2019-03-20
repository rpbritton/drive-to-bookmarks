/* Modules. */
import AccountUIManager from '../lib/js/AccountUIManager.js'

import StorageAPI from '../lib/js/StorageAPI.js'
import AccountManager from '../lib/js/AccountManager.js'

var accountUIManager = new AccountUIManager();
accountUIManager.init();

// /* List stored accounts button. */
// document.getElementById('btn_add_account').addEventListener('click', ev => {
//     AccountProviders.get('Google').add()
//     .then(account => {
//         // console.log(account);
//     });
// });

/* List stored accounts button. */
document.getElementById('btn_list_accounts').addEventListener('click', ev => {
    console.log(AccountManager.getAll());
    // StorageAPI.set({
    //     test: {
    //         a: JSON.stringify([...new Map([
    //                 ['test', 'nice'],
    //                 [1, 5]
    //             ])
    //         ]),
    //         b: 'nice'
    //     }
    // })
    // .then(result => {
    //     StorageAPI.get('test')
    //     .then(result => {
    //         console.log(result);
    //         console.log(JSON.parse(result.a));
    //         console.log(new Map(JSON.parse(result.a)));
    //     })
    // });
});

/* Clear storage. */
document.getElementById('btn_clear_storage').addEventListener('click', event => {
    StorageAPI.clear()
    .then(() => {
        console.log('cleared');
    });
});