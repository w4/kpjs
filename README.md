# KPJS

When executing Javascript, KPJS will check if a [Keybase](https://keybase.io/) user has the domain
registered, if they do then all scripts loaded from that domain must be signed by
the user using a `data-signature` attribute containing a link to the detached
signature of the script.

Once you allow (or deny) a Keybase user to execute Javascript from a given domain
the user is then "pinned" and all JavaScript from then on out must be signed by that
Keybase user. Any subsequent changes to domain ownership on Keybase must be validated
by the user.

### Why?

Compromised web servers run rampant in the wild. We visit all sorts of websites and run arbitrary
code from hundreds of different domains daily. The boys in tinfoil hats run [NoScript](https://noscript.net/)
to either block all JavaScript from running or just allow JavaScript from the domain that they're on. Both of these
"solutions" are flawed, disabling JavaScript hardly gives you a 21st century experience on the web
and if the website you're browsing is compromised then the attacker can return whatever JavaScript they like.

That's where KPJS comes in, instead of trusting a server in some data centre somewhere to give us "safe" scripts,
we trust people instead. Using GPG and Keybase we can have publicly verifiable proof that a script was signed by a person
that we trust rather than a malicious third party (unless our trusted party's GPG key is compromised - but that's a
little bit harder than compromising a server and usually involves leaving the house).

## Things to note

- this hasn't been audited and shouldn't be used as front-line defence for your questionable internet activities
- all unsigned javascript is blocked from being ran
