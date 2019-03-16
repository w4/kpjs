export async function setConfig(key: ConfigKey, value: any) {
    try {
        await browser.storage.sync.set({ [key.toString()]: value });
    } catch (e) {
        console.error("Failed to persist config option to storage", e);
    }
}

export async function getConfig(key: ConfigKey) {
    return (await browser.storage.sync.get({ [key.toString()]: undefined }))[key.toString()]
        || key.defaultValue;
}

export class ConfigKey {
    static readonly ALLOW_UNSIGNED_DOMAINS = new ConfigKey('config.allow_unsigned_script_no_owner', 'yes', { yes: "Yes", no: "No", ask: "Ask" });
    static readonly ALLOW_MIXED_SCRIPTS    = new ConfigKey('config.allow_mixed_unsigned_scripts', 'ask', { yes: "Yes", no: "No", ask: "Ask" });
    static readonly TRUSTED_FIRST_LOAD     = new ConfigKey('config.trust_all_on_first_load', 'yes', { yes: "Yes", no: "No" });

    // private to disallow creating other instances of this type
    private constructor(private key: string, public readonly defaultValue: string, public readonly options: {[key: string]: string}) {
    }

    toString() {
        return this.key;
    }
}