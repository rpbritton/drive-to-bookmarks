/* Modules. */
import * as account_manager from "./lib/account_manager.js"

chrome.extension.onConnect.addListener(port => {
    port.onMessage.addListener(msg => {
        console.log('here: ' +msg);
        port.postMessage('wow');
    });
});

// gapi_manager.add_account()
// .catch(error => {
//     /* FAIL. */
// });