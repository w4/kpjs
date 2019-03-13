import * as P from "bluebird";
import { Buffer as KbpgpBuffer, unbox as unboxSync } from "kbpgp";

import { GetKeybaseUserForDomainEvent, GetKeybaseUserForDomainResponse } from "../common/GetKeybaseUserForDomainEvent";
import { IEvent } from "../common/IEvent";
import KeyRing from "./KeyRing";
import { fetch } from "./util";
import { ScriptInterceptedEvent } from "../common/ScriptInterceptedEvent";

const unbox = P.promisify<any, any>(unboxSync);

export default new class ScriptInterceptor implements EventListenerObject {
    private keyRingCache: { [domain: string]: KeyRing } = {};

    constructor() {
        browser.runtime.onMessage.addListener(async (message: IEvent) => {
            if (message.TYPE === GetKeybaseUserForDomainEvent.TYPE) {
                const event = message as GetKeybaseUserForDomainEvent;
                const keyRing = this.keyRingCache[event.domain];

                if (keyRing) {
                    return new GetKeybaseUserForDomainResponse(
                        await keyRing.getKeybaseUsers(),
                        await keyRing.getTrustedUsers(),
                        await keyRing.getBarredUsers()
                    );
                } else {
                    return new GetKeybaseUserForDomainResponse([], [], []);
                }
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

        try {
            const scriptContent = await this.getScriptContent(script);

            const domain = new URL(script.src || (window as any).location.href).hostname;

            if (await this.verifySignature(script, scriptContent, domain)) {
                // in firefox calling eval on "window" executes in the context of the page thankfully
                (window as any).eval(scriptContent);
            }
        } catch (e) {
            console.error(`Execution of script (${script.src || "inline"}) failed. ${e.name}: ${e.message}`, e.stack);
            throw e;
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
     * TODO: this is unsecure, KPJS is bypassable by just hosting your JS elsewhere.
     * Instead of allowing/denying Keybase users by *script* domain we should allow/deny
     * by *website*, if one script on the page is signed they all must be signed. We need
     * to streamline this process somehow so the user can be told who they trust on their
     * first visit through a meta tag or something and then pin that. (could CSP help here?)
     *
     * @param script script to verify signature of
     * @param scriptContent content of the script that should be signed
     * @param domain domain this script is from
     * @throws Error if signature verification fails
     */
    private async verifySignature(script: HTMLScriptElement, scriptContent: string, domain: string): Promise<boolean> {
        const keyRing = this.getKeyRingForDomain(domain);

        if (!(await keyRing.getKeybaseUsers()).length) {
            // domain has no owner on Keybase, allow all scripts to run from it until
            // we figure out how we're going to handle this nicely (config option probably)
            return true;
        }

        const signatureContent = await this.getSignatureFromScript(script);

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
     * Get signature of the script from the `data-signature` attribute.
     *
     * @param script script to get signature of
     * @throws Error if script is not signed
     */
    private async getSignatureFromScript(script: HTMLScriptElement): Promise<string> {
        const signaturePath = script.dataset.signature;

        if (!signaturePath) {
            throw new Error(`Script not signed (no data-signature attribute)`);
        }

        const signatureRequest = await Promise.resolve(fetch(signaturePath));
        return await signatureRequest.text();
    }
}();
