"use strict";

const client = require("./lib/client");
const { info } = require("./lib/logger");

const jsonfile = require("jsonfile");

var providers = require('require-all')({
    dirname: __dirname + '/providers',
    recursive: true
});

(async function () {
    let token = process.argv[2];

    const request = client.get({
        token
    });

    let profiles = process.argv[3].split(",");

    for (const profile of profiles) {
        info(`Starting provisioning of manifest {profile}.`);
        const configs = jsonfile.readFileSync(__dirname + "/data/" + profile + ".json");

        const provider = providers["access-management"];
        await provider["business-groups"](request, configs["access-management"]["business-groups"]);
        await provider["environments"](request, configs["access-management"]["business-groups"]);
        await provider["identity-providers"](request, configs["access-management"]["identity-providers"]);
        await provider["connected-apps"](request, configs["access-management"]["connected-apps"]);
        await provider["client-providers"](request, configs["access-management"]["client-providers"]);
        await provider["teams"](request, configs["access-management"]);
        await provider["mappings"](request, configs["access-management"]["mappings"]);
        
        info(`Ended provisioning of manifest {profile}.`);
    }
})();