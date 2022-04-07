"use strict";

const { info, error, warn } = require("../../lib/logger");

const LOGGER_NAME = "[access-management][mappings]";

async function getTeams(request, organization_id) {
    return (await request.get(`/accounts/api/organizations/${organization_id}/teams?offset=0&limit=500`)).data.data;
}

async function getProvider(request, organization_id, providerName) {
    const providers = (await request.get(`/accounts/api/cs/organizations/${organization_id}/identityProviders/names`)).data;
    const provider = providers.filter(function (provider) {
        return provider.name === providerName;
    })[0];
    return provider;
}

async function createMappings(request, organizationsId, mappings) {
    for (const mapping of mappings) {
        const providerName = mapping.provider;

        try {
            const provider = await getProvider(request, organizationsId, providerName);

            if (provider) {
                const teams = await getTeams(request, organizationsId);

                for (const map of mapping.mappings) {
                    const team = teams.filter(function (t) {
                        return t.team_name === map.team;
                    })[0];

                    if (team) {
                        const url = `/accounts/api/organizations/${organizationsId}/teams/${team.team_id}/groupmappings`;
                        const data = [{ "external_group_name": map.objectId, "provider_id": provider.provider_id, "membership_type": "member" }];
                        (await request.put(url, data));
                        info(`[mappings] Mapping for team ${map.team} and group name ${map.objectId} is created successfully.`);
                    } else {
                        warn(`[mappings] Team with name ${map.team} is not found.`);
                    }
                }
            } else {
                warn(`[mappings] Provider with name ${providerName} is not found.`);
            }
        } catch (err) {
            error(err.toString());
        }
    }
}

module.exports = async function (request, mappings) {
    const organizations = (await request.get(`/accounts/api/v2/cs`)).data.organizations;
    await createMappings(request, organizations[0].id, mappings);
}