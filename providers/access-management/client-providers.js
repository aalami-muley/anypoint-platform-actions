"use strict";

const _ = require("lodash");

const { warn, info } = require("../../lib/logger");

const LOGGER_NAME = "[access-management][client-providers]";

async function createClientProviders() {
}

module.exports = async function (request, clientProviders) {
    const organizations = (await request.get(`/accounts/api/v2/cs`)).data.organizations;
    await createClientProviders(request, organizations[0].id, clientProviders);
}