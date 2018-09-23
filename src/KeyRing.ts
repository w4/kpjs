import { KeyManager, KeyFetcher, Buffer } from 'kbpgp';
import * as P from 'bluebird';

const import_from_armored_pgp = P.promisify<KeyManager, any>(KeyManager.import_from_armored_pgp, {context: KeyManager});

export default class KeyRing extends KeyFetcher {
    private allKeyIdsForDomainFromKeybase: {[kid: string]: { keyManager: KeyManager, key: any, keybaseUser: string }} = {};

    private trustedUsers: string[] = [];
    private barredUsers: string[] = [];

    constructor(private domain: string) {
        super();
    }

    getKeybaseUsers() {
        return [...new Set(Object.values(this.allKeyIdsForDomainFromKeybase).map((k) => k.keybaseUser))];
    }

    getTrustedUsers() {
        return this.trustedUsers;
    }

    getBarredUsers() {
        return this.barredUsers;
    }

    async fetch(ids: Buffer[], ops: any, cb: (err: Error | null, km?: any, keyId?: number) => void) {
        try {
            await this.populateKeysForDomain();
        } catch (e) {
            return cb(e);
        }

        const hexKeyIds = ids.map((f: any) => f.toString("hex"));

        for (let i = 0; i < hexKeyIds.length; i++) {
            const kid = hexKeyIds[i];
            const k = this.allKeyIdsForDomainFromKeybase[kid];

            if (k && k.key && k.key.key) {
                if (this.barredUsers.includes(k.keybaseUser)) {
                    return cb(new Error(`Keybase user ${k.keybaseUser} is barred from signing scripts from ${this.domain}`), k.keyManager, i);
                } else if (this.trustedUsers.includes(k.keybaseUser) && k.key.key.can_perform(ops)) {
                    console.debug(`Allowing script from ${this.domain} to run as it was signed by ${k.keybaseUser}`);
                    return k.keyManager.fetch(ids, ops, cb);
                }
            }
        }

        return cb(new Error(`Key not found: ${JSON.stringify(hexKeyIds)}`));
    }

    private async populateKeysForDomain(): Promise<void> {
        if (Object.entries(this.allKeyIdsForDomainFromKeybase).length) {
            return;
        }

        await this.loadUsersFromStorage();

        const res = await fetch(`https://keybase.io/_/api/1.0/user/lookup.json?domain=${this.domain}`);
        const users = await res.json();

        for (const user of users.them) {
            const username = user.basics.username;

            if (!this.hasPreviouslySeenKeybaseUser(username)) {
                if (this.getTreatmentForKeybaseUser(username)) {
                    this.trustedUsers.push(username);
                } else {
                    this.barredUsers.push(username);
                }
            }

            // @ts-ignore
            const keyManagers = (await Promise.all(user.public_keys.pgp_public_keys.map((armored) => import_from_armored_pgp({ armored })))) as KeyManager[];

            for (const km of keyManagers) {
                const keys = km.export_pgp_keys_to_keyring();

                for (const key of keys) {
                    const kid = key.key_material.get_key_id().toString("hex");

                    this.allKeyIdsForDomainFromKeybase[kid] = {
                        keyManager: km,
                        key,
                        keybaseUser: username
                    };
                }
            }
        }

        await this.storeUsersInStorage();
    }

    private async loadUsersFromStorage() {
        const trustedUsersStorageKey = `kpj_trusted_signers_${this.domain}`;
        const barredUsersStorageKey = `kpj_barred_signers_${this.domain}`;

        const stored = await browser.storage.local.get({
            [trustedUsersStorageKey]: "[]",
            [barredUsersStorageKey]: "[]"
        });

        for (const user of JSON.parse(stored[trustedUsersStorageKey])) {
            if (!this.trustedUsers.includes(user)) {
                this.trustedUsers.push(user);
            }
        }

        for (const user of JSON.parse(stored[barredUsersStorageKey])) {
            if (!this.barredUsers.includes(user)) {
                this.barredUsers.push(user);
            }
        }
    }

    private async storeUsersInStorage() {
        const trustedUsersStorageKey = `kpj_trusted_signers_${this.domain}`;
        const barredUsersStorageKey = `kpj_barred_signers_${this.domain}`;

        await browser.storage.local.set({
            [trustedUsersStorageKey]: JSON.stringify(this.trustedUsers),
            [barredUsersStorageKey]: JSON.stringify(this.barredUsers)
        });
    }

    private hasPreviouslySeenKeybaseUser(user: string): boolean {
        return [...this.trustedUsers, ...this.barredUsers].includes(user);
    }

    private getTreatmentForKeybaseUser(keybaseUser: string): boolean {
        if (window.confirm(`Since you last ran JavaScript from the domain ${this.domain}, ${keybaseUser} has claimed ownership on Keybase. Would you like to allow JavaScript from this domain to be signed by this user?`)) {
            return true;
        } else {
            return false;
        }
    }
}
