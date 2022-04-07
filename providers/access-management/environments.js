"use strict";

const _ = require("lodash");

const { warn, error, info } = require("../../lib/logger");

const LOGGER_NAME = "[access-management][environments]";

async function createEnvironment(request, organizationId, environment) {
    try {
        const createdEnvironment = (await request.post(`/accounts/api/organizations/${organizationId}/environments`, environment)).data;
        info(`${LOGGER_NAME} Successfully created an environment with name ${environment.name} and ${createdEnvironment.id}`);
    } catch (err) {
        error(`${LOGGER_NAME} Error while creating environment with name ${environment.name} due to : ${(err.response || {}).data || err.toString()}`);
    }
}

module.exports = async function (request, configs) {
    const organizations = (await request.get(`/accounts/api/v2/cs`)).data.organizations;

    for (const config of configs || []) {
        let existingOrganization = _.find(organizations, function (organization) {
            return organization.name === config.name;
        });

        if (existingOrganization && config.environments) {
            const existingEnvironments = (await request.get(`/accounts/api/cs/organizations/${existingOrganization.id}/environments?limit=150&offset=0`)).data.data;
            for (const environment of config.environments || []) {
                if (!_.find(existingEnvironments, function (env) {
                    return env.name === environment.name;
                })) {
                    createEnvironment(request, existingOrganization.id, environment);
                } else {
                    warn(`${LOGGER_NAME} environment with name ${environment.name} was already created.`);
                }
            }
        }
    }
};