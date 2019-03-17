import * as P from "bluebird";
import { Buffer, KeyFetcher, KeyManager } from "kbpgp";
import { PendingSignerError } from "./PendingSignerError";
import { getConfig, ConfigKey } from "../common/config";
import { KeybaseUser, Proof } from "../common/KeybaseUser";

const importFromArmoredPgp = P.promisify<KeyManager, { armored: string }>(KeyManager.import_from_armored_pgp, {
    context: KeyManager
});

export default class KeyRing extends KeyFetcher {
    private allKeyIdsForDomainFromKeybase: {
        [kid: string]: {
            keyManager: KeyManager;
            key: any;
            keybaseUser: KeybaseUser;
        };
    } = {};

    private trustedUsers: string[] = [];
    private barredUsers: string[] = [];
    private pendingApproval: string[] = [];

    constructor(private domain: string) {
        super();
    }

    /**
     * Get all the Keybase users that have this domain registered to their account and that
     * we have allowed/denied for this domain before.
     */
    public async getKeybaseUsers(): Promise<string[]> {
        await this.populateKeysForDomain();

        return [
            ...new Set([
                ...Object.values(this.allKeyIdsForDomainFromKeybase).map(k => k.keybaseUser.name),
                ...(await this.getTrustedUsers()),
                ...(await this.getBarredUsers())
            ])
        ];
    }

    public async getAllCurrentKeybaseOwners() {
        await this.populateKeysForDomain();

        return Object.values(this.allKeyIdsForDomainFromKeybase)
            .reduce((acc: {[name: string]: KeybaseUser}, k) => {
                acc[k.keybaseUser.name] = k.keybaseUser;
                return acc;
            }, {});
    }

    /**
     * Get users that have been previously allowed to run scripts
     * on the `domain` that was used to instantiate this KeyRing.
     */
    public async getTrustedUsers(): Promise<string[]> {
        await this.populateKeysForDomain();

        return this.trustedUsers;
    }

    public addTrustedUser(user: string) {
        this.pendingApproval = this.pendingApproval.filter(v => v !== user);
        this.barredUsers = this.barredUsers.filter(v => v !== user);
        this.trustedUsers.push(user);
        this.storeUsersInStorage();
    }

    /**
     * Get users that have been previously been barred from running scripts
     * on the `domain` that was used to instantiate this KeyRing.
     */
    public async getBarredUsers(): Promise<string[]> {
        await this.populateKeysForDomain();

        return this.barredUsers;
    }

    public addBarredUser(user: string) {
        this.pendingApproval = this.pendingApproval.filter(v => v !== user);
        this.trustedUsers = this.trustedUsers.filter(v => v !== user);
        this.barredUsers.push(user);
        this.storeUsersInStorage();
    }

    public async getPendingApproval(): Promise<string[]> {
        await this.populateKeysForDomain();

        return this.pendingApproval;
    }

    /**
     * Ran by KBPGP to match a key id to a public key. Throws an error if
     * the signer isn't a "trusted" Keybase user
     *
     * @param ids ids to find a public key for
     * @param ops operations that the key should be allowed to run
     * @param cb callback to KBPGP
     */
    public async fetch(ids: Buffer[], ops: any, cb: (err: Error | null, km?: any, keyId?: number) => void) {
        try {
            await this.populateKeysForDomain();
        } catch (e) {
            return cb(e);
        }

        const hexKeyIds = ids.map((f: any) => f.toString("hex"));

        // c-style loop because KBPGP wants an index of `ids` in the callback
        for (let i = 0; i < hexKeyIds.length; i++) {
            const kid = hexKeyIds[i];
            const k = this.allKeyIdsForDomainFromKeybase[kid];

            if (k && k.key && k.key.key) {
                if (this.barredUsers.includes(k.keybaseUser.name)) {
                    return cb(
                        new Error(`Keybase user ${k.keybaseUser.name} is barred from signing scripts from ${this.domain}`),
                        k.keyManager,
                        i
                    );
                } else if (this.pendingApproval.includes(k.keybaseUser.name)) {
                    return cb(
                        new PendingSignerError(`Keybase user ${k.keybaseUser.name} is not yet approved for script signing on ${this.domain}`),
                        k.keyManager,
                        i
                    );
                } else if (this.trustedUsers.includes(k.keybaseUser.name) && k.key.key.can_perform(ops)) {
                    console.debug(`Allowing script from ${this.domain} to run as it was signed by ${k.keybaseUser}`);
                    return k.keyManager.fetch(ids, ops, cb);
                }
            }
        }

        return cb(new Error(`Key not found: ${JSON.stringify(hexKeyIds)}`));
    }

    /**
     * Searches Keybase for 'owners' of this domain, asks the user if they'd like
     * to trust them to run scripts if they haven't seen this 'owner' before and then
     * stores them all keyed by pgp key id for easy lookup in `fetch`.
     */
    private async populateKeysForDomain(): Promise<void> {
        if (Object.entries(this.allKeyIdsForDomainFromKeybase).length) {
            return;
        }

        const firstLoad = !await this.loadUsersFromStorage();

        const res = await fetch(`https://keybase.io/_/api/1.0/user/lookup.json?domain=${this.domain}`);
        const users = await res.json();

        for (const user of users.them) {
            const username = user.basics.username;

            if (!this.hasPreviouslySeenKeybaseUser(username)) {
                const trustedOnFirstLoad = await getConfig(ConfigKey.TRUSTED_FIRST_LOAD);

                if (firstLoad && trustedOnFirstLoad === 'yes') {
                    this.trustedUsers.push(username);
                } else {
                    this.pendingApproval.push(username);
                }
            }

            // @ts-ignore
            const keyManagers = (await Promise.all(
                user.public_keys.pgp_public_keys.map((armored: any) => importFromArmoredPgp({ armored }))
            )) as KeyManager[];

            for (const km of keyManagers) {
                const keys = km.export_pgp_keys_to_keyring();

                for (const key of keys) {
                    const kid = key.key_material.get_key_id().toString("hex");

                    this.allKeyIdsForDomainFromKeybase[kid] = {
                        key,
                        keyManager: km,
                        keybaseUser: {
                            name: username,
                            avatar: (user.pictures.primary || Object.entries(user.basics.pictures)[0] || {})['url'],
                            proofs: Object.entries(user.proofs_summary.by_presentation_group)
                                .reduce((acc: {[name: string]: KeybaseUser}, [k, v]: [string, any]) => {
                                    acc[k] = {
                                        type: v.proof_type,
                                        name: v.nametag,
                                        state: v.state,
                                        url: v.human_url
                                    } as any;
                                    return acc;
                                }, {})
                        }
                    };
                }
            }
        }

        await this.storeUsersInStorage();
    }

    /**
     * Load previously "seen" Keybase users from local storage.
     */
    private async loadUsersFromStorage(): Promise<boolean> {
        const trustedUsersStorageKey = `kpj_trusted_signers_${this.domain}`;
        const barredUsersStorageKey = `kpj_barred_signers_${this.domain}`;

        const stored = await browser.storage.sync.get({
            [trustedUsersStorageKey]: "[]",
            [barredUsersStorageKey]: "[]"
        });

        let hasUsers = false;

        for (const user of JSON.parse(stored[trustedUsersStorageKey])) {
            hasUsers = true;

            if (!this.trustedUsers.includes(user)) {
                this.trustedUsers.push(user);
            }
        }

        for (const user of JSON.parse(stored[barredUsersStorageKey])) {
            hasUsers = true;

            if (!this.barredUsers.includes(user)) {
                this.barredUsers.push(user);
            }
        }

        return hasUsers;
    }

    /**
     * Store "seen" Keybase users in storage so we don't have to keep asking the user
     * if they'd like to run scripts from them for this domain.
     */
    private async storeUsersInStorage() {
        const trustedUsersStorageKey = `kpj_trusted_signers_${this.domain}`;
        const barredUsersStorageKey = `kpj_barred_signers_${this.domain}`;

        await browser.storage.sync.set({
            [trustedUsersStorageKey]: JSON.stringify(this.trustedUsers),
            [barredUsersStorageKey]: JSON.stringify(this.barredUsers)
        });
    }

    /**
     * Checks if the user has previously trusted/barred scripts from the given
     * Keybase user for this domain before.
     *
     * @param user keybase user to check
     */
    private hasPreviouslySeenKeybaseUser(user: string): boolean {
        return [...this.trustedUsers, ...this.barredUsers].includes(user);
    }
}
