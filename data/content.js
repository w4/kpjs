let storage;
let scripts = window.document.getElementsByTagName("script");
let host;

// todo: lookup the key on public key server rather than embedding it

self.port.on("attached", (ss, h) => {
    storage = ss;
    host = h;
    
    // loop over all the scripts on this page or frame
    for (let script of scripts) {
        //console.log(script.innerHTML || script.src);
        let cln = {};
        
        if (script.getAttribute("src"))
            cln.src = script.getAttribute("src");
        else if ("innerHTML" in script)
            cln.innerHTML = script.innerHTML;
        
        self.port.emit("getScript", cln, window.document.querySelector("link[title=key]").getAttribute("href"));
    }
});

// when we recieve a script back
self.port.on("script", (script, key) => {
    if (!script.trim().startsWith("// -----BEGIN PGP SIGNED MESSAGE-----")) {
        // this script isn't signed, don't run it.
        // TODO: give the user the option to run anyway.
        //console.log("this is a test");
        return;
    }
    
    let lines = script.replace(/^\n/, "").split("\n");
    let indentation = lines[0].match(/( +)?\//)[1]; // get initial indentation amount
    indentation = indentation == undefined ? 0 : indentation.length;
    
    lines = lines.map((value) => value.substr(indentation)); // unindent lines
    
    let parsingSignature = false;
    
    lines.forEach((value, index) => {
        if (index < 3) {
            // remove comment from first 3 lines
            lines[index] = value.substr(3);
            return;
        }
        
        if (value == "// -----BEGIN PGP SIGNATURE-----") {
            parsingSignature = true;
        }
        
        if (parsingSignature) {
            // remove comment from signature lines
            lines[index] = value.substr(3);
        }
    });
    
    script = lines.join("\n");
    
    const signed = openpgp.cleartext.readArmored(script);
    const keys = signed.getSigningKeyIds();
    var foundPinned = false;
    
    // workaround for storage.storage not being filled if we dont loop over it first
    // or access it as an object.
    console.log(storage.storage);
    
    if (storage.storage[`pinned_${host}`]) {
        // we've visited this site before! check if we trust their script.
        
        let keysToPin = []; // new keys that we haven't already pinned to pin
        
        // keys we trust
        let trustedKeys = storage.storage[`pinned_${host}`].map((value) => openpgp.key.readArmored(value).keys[0]);
        
        if (!signed.verify(trustedKeys)) { 
            // this script was sent to us by an untrusted source. DO NOT EXECUTE.
            alert("We were sent a signed script by a source we do not trust.");
            // TODO: give the user the option to ignore this.
        } else {
            // add keys we've not seen before to the pinned keys list
            storage.storage[`pinned_${host}`] = [...storage.storage[`pinned_${host}`], ...keysToPin];
            console.log(signed.text);
            window.eval(signed.text);
            
            /*for (let key of keys) {            
                if (!storage.storage[`pinned_${host}`].indexOf(key.toHex()) > -1) {
                    // look up the key id on a public key server and store it
                    // keysToPin.push(key.toHex());
                    console.log("Adding " + key.toHex() + " to trust.");
                }
            }*/
        }
    } else {
        // it's our first time seeing an encrypted script on this site. pin the keys and exec the script
        storage.storage[`pinned_${host}`] = [key];  
        
        /*for (let key of keys) {
            // todo: look up this key on public key server
            storage.storage[`pinned_${host}`].push(key.toHex());
        }*/
        
        window.eval(signed.text);
        console.log(signed.text);
    }
});