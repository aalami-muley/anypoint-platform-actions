"use strict";

const _ = require("lodash");

const { warn, info } = require("../../lib/logger");

const LOGGER_NAME = "[access-management][connected-apps]";

function getData(connectedApp) {
    return connectedApp;
}

async function createConnectedApps(request, org_id, connectedApps) {
    const existingConnectedApps = (await request.get(`/accounts/api/connectedApplications?limit=100&offset=0&includeUsage=true`)).data.data;

    for (const connectedApp of connectedApps || []) {
        if (!_.find(existingConnectedApps, function (app) {
            return app.client_name === connectedApp.client_name;
        })) {
            const data = getData(connectedApp);
            (await request.post(`/accounts/api/connectedApplications`, data));
            info(`${LOGGER_NAME} Connected Application with name ${connectedApp.client_name} is successfully created.`);
        } else {
            warn(`${LOGGER_NAME} Connected Application with name ${connectedApp.client_name} is already created.`);
        }
    }
}

module.exports = async function (request, connectedApps) {
    const organizations = (await request.get(`/accounts/api/v2/cs`)).data.organizations;
    await createConnectedApps(request, organizations[0].id, connectedApps);
}