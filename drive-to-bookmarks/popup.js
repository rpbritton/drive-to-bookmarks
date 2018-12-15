/* Modules. */
// import * as gapi_manager from './lib/gapi_manager.js'
// import * as storage_manager from './lib/storage_manager.js'
// import * as nametag_manager from './lib/nametag_manager.js'

/* Add the popup button event. */
document.getElementById('btn_options').addEventListener('click', ev => {
    chrome.runtime.openOptionsPage();
});

// /* Add the account labels. */
// nametag_manager.update();