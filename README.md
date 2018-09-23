# CryptoScript
An extremely basic POC for GPG signed JavaScript. Currently only verifies signatures are attached
to scripts. If the JavaScript isn't signed, or the signature isn't valid, the JavaScript isn't executed.

An example implementation of HPKP for JavaScript. We trust the website the first time we visit it,
and we store the GPG public key they used to sign their JavaScript in our keychain. Every time we
visit that domain after that, we will verify that the JavaScript is signed with a key we trust from
that domain.

You can sign a file with multiple keys, this allows revocation of other keys at a later date.

Keypinned JavaScript could protect against an attacker having physical access to the server. Without
the GPG key used to sign the scripts on the page the first time the user visits it, the attacker
will not be able to execute malicious scripts on the client's machine.

As this is a POC, all scripts on a website are required to be signed with the same key. To sign a script
simply add a `data-signature` attribute to your script with a relative or absolute link to the detached
signature of the script.
