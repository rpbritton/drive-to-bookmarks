export default function XHR(method, url) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    resolve(JSON.parse(xhr.responseText));
                    return;
                }
                else {
                    reject(Error(xhr.status));
                    return;
                }
            }
        }

        xhr.onerror = () => {
            reject();
            return;
        };
    
        xhr.open(method, encodeURI(url), true);
        xhr.send();
    });
}