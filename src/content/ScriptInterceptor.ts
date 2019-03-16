import * as P from "bluebird";
import { Buffer as KbpgpBuffer, unbox as unboxSync } from "kbpgp";

import { GetKeybaseUserForDomainEvent, GetKeybaseUserForDomainResponse } from "../common/GetKeybaseUserForDomainEvent";
import { IEvent } from "../common/IEvent";
import KeyRing from "./KeyRing";
import { fetch } from "./util";
import { GetUsersAwaitingConsentEvent, GetUsersAwaitingConsentResponse, AllowUserEvent, DeniedUserEvent } from "../common/GetUsersAwaitingConsentEvent";
import { Script } from "../common/Script";
import { PendingSignerError } from "./PendingSignerError";

const unbox = P.promisify<any, any>(unboxSync);

export default new class ScriptInterceptor implements EventListenerObject {
    private keyRingCache: { [domain: string]: KeyRing } = {};

    private lock: boolean = false;
    private scriptQueue: HTMLScriptElement[] = [];

    constructor() {
        browser.runtime.onMessage.addListener(async (message: IEvent) => {
            if (message.TYPE === GetKeybaseUserForDomainEvent.TYPE) {
                const event = message as GetKeybaseUserForDomainEvent;
                const keyRing = this.getKeyRingForDomain(event.domain);

                return new GetKeybaseUserForDomainResponse(
                    await keyRing.getKeybaseUsers(),
                    await keyRing.getTrustedUsers(),
                    await keyRing.getBarredUsers(),
                    await keyRing.getPendingApproval()
                );
            } else if (message.TYPE === GetUsersAwaitingConsentEvent.TYPE) {
                const event = message as GetUsersAwaitingConsentEvent;
                const keyRing = this.getKeyRingForDomain(event.domain);
                return new GetUsersAwaitingConsentResponse(await keyRing.getPendingApproval());
            } else if (message.TYPE === AllowUserEvent.TYPE) {
                const event = message as AllowUserEvent;
                this.getKeyRingForDomain(event.domain).addTrustedUser(event.user);
                await this.drainScriptQueue();
            } else if (message.TYPE === DeniedUserEvent.TYPE) {
                const event = message as DeniedUserEvent;
                this.getKeyRingForDomain(event.domain).addBarredUser(event.user);
                await this.drainScriptQueue();
            }
        });
    }

    /**
     * Called whenever a script is about to be ran on the webpage. Verifies the
     * script is signed by someone we trust from Keybase before running it.
     *
     * @param e `beforescriptexecute` event
     */
    public async handleEvent(e: Event) {
        // stop this script from being executed
        e.preventDefault();
        e.stopPropagation();

        // the script tag that we stopped from running
        const script = e.target as HTMLScriptElement;

        const monitor = setInterval(async () => {
            if (this.lock) return;

            try {
                this.lock = true;

                await this.checkPermissionMaybeExecute(script);
            } catch (e) {
                console.error(`Execution of script (${script.src || "inline"}) failed. ${e.name}: ${e.message}`, e.stack);
                throw e;
            } finally {
                this.lock = false;
                clearInterval(monitor);
            }
        }, 10);
    }

    private async checkPermissionMaybeExecute(script: HTMLScriptElement) {
        const scriptContent = await this.getScriptContent(script);

        const domain = new URL((window as any).location.href).hostname;

        if (this.scriptQueue.length > 0) {
            this.scriptQueue.push(script);
            script.parentNode.removeChild(script);
            return;
        }

        try {
            if (await this.verifySignature(script, scriptContent, domain)) {
                // in firefox calling eval on "window" executes in the context of the page thankfully
                (window as any).eval(scriptContent);
            } else {
                script.parentNode.removeChild(script);
            }
        } catch (e) {
            if (e instanceof PendingSignerError) {
                this.scriptQueue.push(script);
                script.parentNode.removeChild(script);
            } else {
                throw e;
            }
        }
    }

    private async drainScriptQueue() {
        const domain = new URL((window as any).location.href).hostname;

        while (this.scriptQueue.length > 0) {
            const script = this.scriptQueue.shift();

            try {
                const scriptContent = await this.getScriptContent(script);

                if (await this.verifySignature(script, scriptContent, domain)) {
                    (window as any).eval(scriptContent);
                } else {
                    console.log(`Script depends on a blocked signer, there's still ${this.scriptQueue.length} elements left in the script queue.`);
                    this.scriptQueue.unshift(script);
                    return;
                }
            } catch (e) {
                if (e instanceof PendingSignerError) {
                    this.scriptQueue.unshift(script);
                    console.log(`Script depends on a pending signer, there's still ${this.scriptQueue.length} elements left in the script queue.`);
                    return;
                } else {
                    this.scriptQueue.unshift(script);
                    throw e;
                }
            }
        }

        for (const script of this.scriptQueue) {
            try {
                const scriptContent = await this.getScriptContent(script);

                if (await this.verifySignature(script, scriptContent, domain)) {
                    (window as any).eval(scriptContent);
                    this.scriptQueue.shift();
                } else {
                    console.log(`Script depends on a blocked signer, there's still ${this.scriptQueue.length} elements left in the script queue.`);
                    return;
                }
            } catch (e) {
                if (e instanceof PendingSignerError) {
                    console.log(`Script depends on a pending signer, there's still ${this.scriptQueue.length} elements left in the script queue.`);
                    return;
                } else {
                    throw e;
                }
            }
        }
    }

    /**
     * Gets the `KeyRing` for the given domain or creates one if one doesn't
     * already exist.
     *
     * @param domain domain to get `KeyRing` for
     */
    private getKeyRingForDomain(domain: string) {
        return (this.keyRingCache[domain] = this.keyRingCache[domain] || new KeyRing(domain));
    }

    /**
     * Ensure this script is signed by someone that we trust.
     *
     * If the domain the script is loaded from doesn't have an owner on Keybase
     * then it is currently always executed. If the domain does have an owner
     * then all scripts from the domain must be loaded from them.
     *
     * @param script script to verify signature of
     * @param scriptContent content of the script that should be signed
     * @param domain domain this script is from
     * @throws Error if signature verification fails
     */
    private async verifySignature(script: HTMLScriptElement, scriptContent: string, domain: string): Promise<boolean> {
        const signaturePath = script.dataset.signature;

        if (!signaturePath) {
            return await this.getTreatmentForUnsignedScripts(domain);
        }

        const keyRing = this.getKeyRingForDomain(domain);

        if (!(await keyRing.getKeybaseUsers()).length) {
            // domain has no owner on Keybase, allow all scripts to run from it until
            // we figure out how we're going to handle this nicely (config option probably)
            return true;
        }

        const signatureContent = await (await fetch(signaturePath)).text();

        const literals = await unbox({
            armored: new KbpgpBuffer(signatureContent),
            data: new KbpgpBuffer(scriptContent),
            keyfetch: keyRing
        });

        if (literals[0] && literals[0].get_data_signer()) {
            const km = literals[0].get_data_signer().get_key_manager();
            console.info(
                `Executing JS (${script.src || "inline"}) signed by key ${km.get_pgp_fingerprint().toString("hex")}`
            );
            return true;
        } else {
            throw new Error(`Script wasn't signed by one of: ${JSON.stringify(keyRing.getTrustedUsers())}`);
        }
    }

    /**
     * Get the JavaScript from the <script> tag
     *
     * @param script script to get content of
     */
    private async getScriptContent(script: HTMLScriptElement): Promise<string> {
        if (script.src) {
            const scriptRequest = await fetch(script.src);
            return scriptRequest.text();
        } else {
            // this is an inline script
            return script.innerHTML;
        }
    }

    /**
     * Ask the user whether or not they'd like to run unsigned scripts.
     */
    private async getTreatmentForUnsignedScripts(domain: string): Promise<boolean> {
        const storageKey = `kpj_unsigned_scripts_${domain}`;

        const storedAnswer = (await browser.storage.local.get(storageKey))[storageKey];

        if (storedAnswer !== undefined) {
            return !!storedAnswer;
        } else {
            const confirmation = !!window.confirm('There are unsigned scripts on this website, would you like to run them?');
            await browser.storage.local.set({ [storageKey]: confirmation });
            return confirmation;
        }
    }
}();
