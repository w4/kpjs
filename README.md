# CryptoScript
An extremely basic POC for GPG signed JavaScript. Currently only verifies signatures are attached
to scripts. If the JavaScript isn't signed, or the signature isn't valid, the JavaScript isn't executed.

An example implementation of HPKP for JavaScript. We trust the website the first time we visit it,
and we store the GPG public key they used to sign their JavaScript in our keychain. Every time we
visit that domain after that, we will verify that the JavaScript is signed with a key we trust from
that domain.

You can sign a file with multiple keys, this allows revocation of other keys at a later date.

This protects against physical access to the server at a later date, for example. The JavaScript is
not signed with the original private key so we will not execute it.

Currently we require all scripts to be signed with the same key. To sign a script simply add a
`data-signature` attribute to your script with a relative or absolute link to the detached signature
of the script.