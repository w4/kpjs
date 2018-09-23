export default class KeyRing extends kbpgp.KeyFetcher {
    constructor(hostname) {
        super();
        this.hostname = hostname;
    }

    fetch(ids, ops, cb) {
        const storageKey = `js_pk_${this.hostname}`;

        if (!localStorage.getItem(storageKey)) {
            // this is our first time on this domain, pin the keys from the signature
            localStorage.setItem(storageKey, ids);
            return cb(null, 0);
        }

        const keyStore = localStorage.getItem(storageKey);

        if ([...ids].filter(x => keyStore.has(x.toString('hex'))).length) {
            // we have a valid signature! - update our key store with any new keys this JS
            // file is signed with
            localStorage.setItem(storageKey, [...keyStore, ...[...ids].filter(x => !keyStore.has(x))]);
            return cb(null, 0);
        }
    }
}