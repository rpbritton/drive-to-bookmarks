// /* Modules. */
// import * as storage_manager from './lib/storage_manager.js'

// export function update() {
//     storage_manager.get_all_accounts()
//     .then(account_ids => {
//         let wrappers = document.getElementsByClassName('nametag_wrapper');
        
//         for (let wrapper of wrappers) {
//             update_wrapper(wrapper, account_ids);
//         }
//     });
// }

// function update_wrapper(wrapper, account_ids) {
//     for (let nametag of wrappers.children) {
//         if (nametag.classList.contains('nametag')) {
//             if (account_ids.contains(nametag.getAttribute("account_id"))) {

//             }
//         }
//     }
// }