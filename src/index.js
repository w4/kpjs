let pubkey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEWZDJPRYJKwYBBAHaRw8BAQdATQ0jtB2qHp+xXenI4j79cdG1wqYKAkpYKgWO
oybchRC0JEpvcmRhbiBEb3lsZSA8am9yZGFuamRAYW1hem9uLmNvLnVrPoiWBBMW
CgA+FiEE7+McS1rt1WUECYtJ0M14VeuAY9IFAlmQyT0CGwMFCQWjmoAFCwkIBwMF
FQoJCAsFFgIDAQACHgECF4AACgkQ0M14VeuAY9Lc0gD/aok9SyyKxTZlCyfOsfpz
3aM5SX5ll7jreknNvzld8gQA/1PtLdZa5Vpu6iAl4hmZ7upsFeIfCKMXCJbCJgCb
1q4IiQI5BBMBCgAjFiEEMn1zof7yzaURQBGDHqa65vZtxJoFAlmRgH4FgweGH4AA
CgkQHqa65vZtxJq8iRAAo8ZP40R8M5XzavRISNdytc78/v/hF/cNnEgdXgF7UMYu
4BEGFit/9tzU+dJuD+BfUu0UCeCfOU8B7SyZCH5e9g+vkZLpLsBSdCgMRbXFzEwM
fFRhL0spahHqi+OsNdaHk9cUhXGWaU5okOqGYmAeLCCUJsUi8rYYr82ILlnddFDs
i5NEaLt2s/TYumLxY0E9+XIyPNDX+AR4FozDrd31NWhMuUS0jLvSdMO1D8vuTKs+
cA7dgvg41l6GAeyho03VvNdapLl/ofPBhNHV1xN0tGZDXAXhU36VuOXPIidtKUow
5hOsoghb5chg6pGFqQP4rJ8viEr3T9VBwDyi2Zle0gKw8HtDD65Y6ZjPa3+YCddA
pMt2gnLMUf4a9rNca/p/axlQTFN3TB2j93dfp5M5vYP6i+N8inpCyu/Qb6F5YMMa
/sHHH60GxFjDRuwZgY+2adJrbeYAFglRB4lBc4LOfT5T+LREF78d8uxD80kHlyda
TyMN1cPU1V33A29V910FEEQkPhl6NROzEAgL1AzoqaL8JDgrcgcZkY6kRdDlseLI
SBlOvluKltTJYUEi9ZICN55uei5aw2qGogcjggvtZeghnus8sp9tI35u5UlhupP4
P4Zzmj03/pgM6xuI7CoD55Lzg5OzIQR5a00PM74uXlRwpP8eCqqMImLBJUGZSFO4
OARZkMk9EgorBgEEAZdVAQUBAQdABQP5YGQDpgn9N3MsI2AL2RAuZ8IewRtJ7R4d
M1QcoUEDAQgHiH4EGBYKACYWIQTv4xxLWu3VZQQJi0nQzXhV64Bj0gUCWZDJPQIb
DAUJBaOagAAKCRDQzXhV64Bj0tWTAQCxjIL9Y7pomp5UeOsV7ksnYeiGn/dtkA9p
ZEGQa+2EWwEA8NM+PT/Y1vhVx3yIW99hPzSmqA6CzpbU+UmjtpR3Hge4MwRZkMua
FgkrBgEEAdpHDwEBB0CXs7NyGYJfXc8nauROVFxB/9q6eLSCSw5MtSzHyvR3jYh+
BBgWCgAmFiEE7+McS1rt1WUECYtJ0M14VeuAY9IFAlmQy5oCGyAFCQPCZwAACgkQ
0M14VeuAY9LhJgEAgjw2Bfh4w3ogBMG1MCUsYA5rlHAG+mFFhz0jHcIVAzYBALuR
luednY+733qEg9R5T3UMI4sc2NBEgjDbhBqCXyAB
=xRFJ
-----END PGP PUBLIC KEY BLOCK-----
`;

P.promisifyAll(kbpgp, { suffix: '_async' });

document.addEventListener("beforescriptexecute", async (e) => {
    "use strict";

    // stop this script from being executed
    e.preventDefault();
    e.stopPropagation();

    // the script tag that we stopped from running
    const script = e.target;
    const signaturePath = script.dataset.signature;

    if (!signaturePath) {
        alert(`We stopped a script from running because it wasn't signed. (${script.src || 'inline'})`);
        return;
    }

    let content;

    if (script.src) {
        // run fetch in the context of the webpage so relative urls work in firefox - we use
        // Promise.resolve so the thens don't run in the webpage context
        const scriptRequest = await Promise.resolve((XPCNativeWrapper(window.wrappedJSObject.fetch) || fetch)(script.src));
        content = await scriptRequest.text();
    } else {
        // this is an inline script
        content = script.innerHTML;
    }

    // run fetch in the context of the webpage so relative urls work in firefox - we use
    // Promise.resolve so the thens don't run in the webpage context
    const signatureRequest = await Promise.resolve((XPCNativeWrapper(window.wrappedJSObject.fetch) || fetch)(signaturePath));
    const signature = await signatureRequest.text();

    const key = await kbpgp.KeyManager.import_from_armored_pgp_async({ armored: pubkey });

    const keyring = new kbpgp.keyring.KeyRing();
    keyring.add_key_manager(key);

    try {
        const literals = await kbpgp.unbox_async({
            armored: new kbpgp.Buffer(signature),
            data: new kbpgp.Buffer(content),
            keyfetch: new KeyRing(new URL(script.src || window.location.href).hostname)
        });

        let km;

        if (km = literals[0].get_data_signer().get_key_manager()) {
            console.log(`Executing JS (${script.src || 'inline'}) signed by key ${km.get_pgp_fingerprint()
                .toString('hex')}`);
        }
    } catch (e) {
        // Bad signature!
        console.log(`Bad signature from script. Blocked execution of script (${script.src || 'inline'}).`,
            e.message);
        return false;
    }

    try {
        // in firefox calling eval on "window" executes in the context of the page thankfully
        window.eval(content);
    } catch (e) {
        // the script errored, we'll just print it since there's not much more we can do with it
        console.error(`${e.name}: ${e.message}`, e.stack);
    }
}, true);