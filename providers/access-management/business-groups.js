"use strict";

const _ = require("lodash");

const { error, info } = require("../../lib/logger");

const LOGGER_NAME = "[access-management][business-groups]";

function validate(config) {
    if (!config) {
        throw new Error(`${LOGGER_NAME} Config must be defined`);
    }

    if (!config.ownerId) {
        throw new Error(`${LOGGER_NAME} The owner id should be defined.`);
    }

    if (!config.name) {
        throw new Error(`${LOGGER_NAME} The organization name should be defined.`);
    }
}

function getData(config) {
    let entitlements = _.defaults(config,
        {
            "vCoresProduction": 0,
            "vCoresSandbox": 0,
            "vCoresDesign": 0,
            "staticIps": 0,
            "vpcs": 0,
            "loadBalancer": 0,
            "vpns": 0,
            "createSubOrgs": true,
            "createEnvironments": true,
            "globalDeployment": true,
        }
    );
    return {
        "name": config.name,
        "parentOrganizationId": config.parentOrganizationId,
        "ownerId": config.ownerId,
        entitlements
    };
}

async function createBusinessGroup(request, parentOrganizationId, config, organizations) {
    try {
        let existingOrganization = _.find(organizations, function (organization) {
            return organization.name === config.name;
        });

        if (!existingOrganization) {
            config.parentOrganizationId = config.parentOrganizationId || parentOrganizationId;
            existingOrganization = (await request.post(`/accounts/api/organizations`, getData(config))).data;
            info(`${LOGGER_NAME} Business group with name ${config.name} was successfully created.`);
        } else {
            info(`${LOGGER_NAME} Business group with name ${config.name} was already created.`);
        }

        if (config.children) {
            for (const child of config.children || []) {
                createBusinessGroup(request, existingOrganization.id, child, organizations);
            }
        }
    } catch (err) {
        error(`${LOGGER_NAME} Error while creating business group with name ${config.name} due to : ${(err.response || {}).data || err.toString()}`);
    }
}

module.exports = async function (request, configs) {
    if (!configs) {
        throw new Error(`${LOGGER_NAME} Configs must be defined`);
    }

    for (const config of configs) {
        validate(config);
    }

    const organizations = (await request.get(`/accounts/api/v2/cs`)).data.organizations;

    for (const config of configs || []) {
        await createBusinessGroup(request, organizations[0].id, config, organizations);
    }
}