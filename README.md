# CryptoScript
An extremely basic POC for GPG signed JavaScript with key pinning. Verifies the sender of JavaScript and does not execute it if we do not trust the sender.

## CURRENTLY DOES NOT WORK AT ALL. DO NOT EXPECT IT TO BE SECURE OR EVEN WORK AT THE MOMENT.

An example implementation of HPKP for JavaScript. We trust the website the first time we visit it, and we store the GPG public key they used to sign their JavaScript in our keychain. Every time we visit that domain after that, we will verify that the JavaScript is signed with a key we trust from that domain.

You can sign a file with multiple keys, this allows revocation of other keys at a later date.

This protects against physical access to the server at a later date, for example. The JavaScript is not signed with the original private key so we will not execute it.

This does not take into account scripts from other domains and requires all scripts on a page to be signed with a single private key.

Scripts look something like this currently, we'll have to look into something nicer looking (and more compact) at a later date:

    <script>
    // -----BEGIN PGP SIGNED MESSAGE-----
    // Hash: SHA512
    //
    alert('This is a safe test!');
    // -----BEGIN PGP SIGNATURE-----
    //
    // iQIcBAEBCgAGBQJXLeRAAAoJEJgiOID07YTIuxQP/0hADaGtrqCr5aLufsyUfiqV
    // TSsFei6fxUaaYY8OdO7XTkgO6HAMtJ60Dx8Lh6HD8MG18B3IEU8AJIS0INr7uCdk
    // 93hFHBOWoApXsd8nh0P3CiixqFKqpnnkJ0fIkCQOT4ophV5as4I3pf02/eMaVT/v
    // A+0ADX+sfke2DG3t/mi6WoiIRhkYtY2xaOEDdXS9+YnXYvh2rzffRVdxXLIyo7BU
    // wW+2lz8pGhA2POZSZLqPyyIOCWjOex+apc/FfGKQBUA5NlHLMmucHuHKVTXHBk8K
    // 86K3xjDgn8kGWQ+aFOgvebniJOmlCeMK2sulNdzVoeSfMaCdHsN+L/EyhllG0l1+
    // ZBxzz9p6nZ7HAh5alC4y7rBkraGRjFV0CvOWuRtElzSGeis9mY/zbBCkn8jJ3dLS
    // dq+jOLabCzsqKCYwDq5cVoG1uko4mtix0uD6miWdcgP0HSzO1LLPHk4PIO6uX87d
    // gQBBRd84XkOmTKjX3Tll67TGdNoMUfnKeWmvErK07Y9CWZhB+ce1pbTOzmvo/Lcw
    // m/fboLhC3IfrZsOP/PQRYaJ4r+9ZF+2kb/1vSuWIf+DWk8OJAXj+1GSsHFnZNl69
    // ba6kxz+CC6Vf/ajOOd79fk8XMy4RdFX4fDdgEK5cX/CLPrbHagd5b2qVI5GRDtTl
    // E1ngBB/mKgVu25PjwalE
    // =Sv9Y
    // -----END PGP SIGNATURE-----
    </script>