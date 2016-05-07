const self = require("sdk/self");
const { PageMod } = require("sdk/page-mod");
const { URL } = require("sdk/url");
const { Request } = require('sdk/request');
const PrefServ = require("sdk/preferences/service");
const ss = require("sdk/simple-storage");

// disable all javascript by default.
PrefServ.set("javascript.enabled", false);

exports.onUnload = (reason) => {
    if (reason == "disable" || reason == "uninstall") {
        PrefServ.reset("javascript.enabled");
    }
};

PageMod({
    include: "*",
    contentScriptWhen: "ready",
    contentScriptFile: [self.data.url("../node_modules/openpgp/dist/openpgp.js"), self.data.url("content.js")],
    attachTo: ["top", "frame"],
    onAttach: (worker) => {
        worker.port.on('getScript', (script, key) => {
            Request({
                url: key,
                onComplete: (key) => {
                    if ('src' in script) {
                        // get the content of this script from the src
                        Request({
                            url: script,
                            onComplete: (resp) => worker.port.emit('script', resp.text, key.text)
                        }).get();
                    } else if ('innerHTML' in script) {
                        // get the content of this script
                        worker.port.emit('script', script.innerHTML, key.text);
                    } else {
                        return;
                    }
                }
            }).get();
        });
        
        worker.port.emit('attached', ss, URL(worker.tab.url).host);
    }
});
