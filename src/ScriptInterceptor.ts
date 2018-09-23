import { unbox as unboxSync, Buffer as KbpgpBuffer } from 'kbpgp';
import * as P from 'bluebird';

import KeyRing from './KeyRing';
import { GetKeybaseUserForDomainEvent, GetKeybaseUserForDomainResponse } from "../common/GetKeybaseUserForDomainEvent";

const unbox = P.promisify<any, any>(unboxSync);

declare function XPCNativeWrapper<T>(obj: T): T;
declare namespace window {
    const wrappedJSObject: {
        fetch: (url: string) => Promise<any>;
    };
}

export default new class ScriptInterceptor implements EventListenerObject {
    private keyRingCache: { [domain: string]: KeyRing } = {};

    constructor() {
        browser.runtime.onMessage.addListener(async (message: any) => {
            if (message.TYPE == GetKeybaseUserForDomainEvent.TYPE) {
                const keyRing = this.keyRingCache[message.domain];

                if (keyRing) {
                    return new GetKeybaseUserForDomainResponse(keyRing.getKeybaseUsers(), keyRing.getTrustedUsers(), keyRing.getBarredUsers());
                } else {
                    return new GetKeybaseUserForDomainResponse([], [], []);
                }
            }
        });
    }

    async handleEvent(e: Event) {
        // stop this script from being executed
        e.preventDefault();
        e.stopPropagation();

        // the script tag that we stopped from running
        const script = e.target as HTMLScriptElement;

        try {
            const signatureContent = await this.getSignatureFromScript(script);
            const scriptContent = await this.getScriptContent(script);

            const domain = new URL(script.src || (window as any).location.href).hostname;

            if (await this.verifySignature(script, scriptContent, signatureContent, domain)) {
                // in firefox calling eval on "window" executes in the context of the page thankfully
                (window as any).eval(scriptContent);
            }
        } catch (e) {
            console.error(`Execution of script (${script.src || 'inline'}) failed. ${e.name}: ${e.message}`, e.stack);
            throw e;
        }
    }

    private async verifySignature(script: HTMLScriptElement, scriptContent: string, signatureContent: string, domain: string): Promise<boolean> {
        try {
            this.keyRingCache[domain] = this.keyRingCache[domain] || new KeyRing(domain);

            // commented out to prevent execution of scripts from any unsigned domain
            /*if (!this.keyRingCache[domain].getKeybaseUsers().length) {
                // this domain isn't registered to any keybase users, allow execution
                // of all scripts by default
                return true;
            }*/

            const literals = await unbox({
                armored: new KbpgpBuffer(signatureContent),
                data: new KbpgpBuffer(scriptContent),
                keyfetch: this.keyRingCache[domain],
            });

            let km;
            if (km = literals[0].get_data_signer().get_key_manager()) {
                console.info(`Executing JS (${script.src || 'inline'}) signed by key ${km.get_pgp_fingerprint().toString('hex')}`);
                return true;
            } else {
                throw new Error("Couldn't match signing key for script with one of the Keybase user's keys");
            }
        } catch (e) {
            console.error(`Bad signature from script. Blocked execution of script (${script.src || 'inline'}). ${e.message}`);
            return false;
        }
    }

    private async getScriptContent(script: HTMLScriptElement): Promise<string> {
        if (script.src) {
            const scriptRequest = await this.fetch(script.src);
            return scriptRequest.text();
        } else {
            // this is an inline script
            return script.innerHTML;
        }
    }

    private async getSignatureFromScript(script: HTMLScriptElement): Promise<string> {
        const signaturePath = script.dataset.signature;

        if (!signaturePath) {
            throw new Error(`We stopped a script from running because it wasn't signed. (${script.src || 'inline'})`);
        }

        const signatureRequest = await Promise.resolve(this.fetch(signaturePath));
        return await signatureRequest.text();
    }

    private fetch(path: string) {
        // run fetch in the context of the webpage so relative urls work in firefox - we use
        const fetchWrapped = XPCNativeWrapper((window as any).wrappedJSObject.fetch) || fetch;

        // Promise.resolve so the thens don't run in the webpage context
        return Promise.resolve(fetchWrapped(path));
    }
}
