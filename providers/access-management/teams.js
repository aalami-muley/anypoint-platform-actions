"use strict";

const _ = require("lodash");

const { info, error } = require("../../lib/logger");

const LOGGER_NAME = "[access-management][teams]";

async function sleep(duration) {
    await new Promise(resolve => setTimeout(resolve, duration || 2000));
}

async function createTeams(request, masterOrganizationId, organizationId, parent_team_id, teams, roles) {
    if (!teams || teams.length === 0) {
        return;
    }

    const environments = (await request.get(`/accounts/api/organizations/${organizationId}/environments?offset=0&limit=500`)).data.data;
    const existingTeams = (await request.get(`/accounts/api/organizations/${masterOrganizationId}/teams?offset=0&limit=500`)).data.data;

    for (const team of teams) {
        let parentExistingTeam = existingTeams.filter(function (existingTeam) {
            return existingTeam.team_name === team.name;
        })[0];

        if (parentExistingTeam) {
            info(`${LOGGER_NAME} Team with name ${team.name} is already created within organization ${organizationId}`);
        } else {
            try {
                const data = { "team_name": team.name, "team_type": team.type || "internal", parent_team_id };
                parentExistingTeam = (await request.post(`/accounts/api/organizations/${masterOrganizationId}/teams`, data)).data;
                await sleep();
            } catch (err) {
                error(err.toString());
            }
        }

        let existingRoles = (await request.get(`/accounts/api/organizations/${masterOrganizationId}/teams/${parentExistingTeam.team_id}/roles?offset=0&limit=500`)).data.data;
        let rolesData = [];
        let rolesContextData = [];
        for (const role of team.roles || []) {
            const role_name = role.name || role;

            const role_id = roles.filter(function (role) {
                return role.name === role_name;
            })[0].role_id;

            const isRoleAlreadyRegistered = existingRoles.filter(function (role) {
                role.role_id === role_id;
            })[0];

            if (!isRoleAlreadyRegistered) {
                if (role.envs) {
                    for (const env of role.envs) {
                        const existingEnvironment = environments.filter(function (environment) {
                            return environment.name === env;
                        })[0];

                        if (existingEnvironment) {
                            rolesContextData.push({
                                role_id,
                                "context_params": {
                                    "org": organizationId,
                                    "envId": existingEnvironment.id
                                }
                            });
                        }
                    }
                } else {
                    rolesData.push({
                        role_id,
                        "context_params": {
                            "org": organizationId
                        }
                    });
                }
            } else {
                info(`${LOGGER_NAME} Skipping already registered role with id ${role_id}`);
            }
        }

        try {
            if (rolesData && rolesData.length > 0) {
                info(`${LOGGER_NAME} Applying ${rolesData.length} roles to team with name ${parentExistingTeam.team_name}`);
                try {
                    await sleep();
                    (await request.post(`/accounts/api/organizations/${masterOrganizationId}/teams/${parentExistingTeam.team_id}/roles`, rolesData));
                    info(`${LOGGER_NAME} ${rolesData.length} roles were applied successfully`);
                } catch (err) {
                    error(`Unable to add roles due to ${err.response.data}`);
                }
            }

            if (rolesContextData.length > 0) {
                info(`${LOGGER_NAME} Applying ${rolesContextData.length} contextual roles to team with name ${parentExistingTeam.team_name}`);
                await sleep();
                const url = `/accounts/api/organizations/${masterOrganizationId}/teams/${parentExistingTeam.team_id}/roles`;
                (await request.post(url, rolesContextData));
                info(`${LOGGER_NAME} ${rolesContextData.length} roles were applied successfully`);
            }
        } catch (err) {
            error((err.response || {}).data);
            error(err.toString());
        }

        await createTeams(request, masterOrganizationId, organizationId, parentExistingTeam.team_id, team.children, roles);
    }
}

module.exports = async function (request, accessManagement) {
    const organizations = (await request.get(`/accounts/api/v2/cs`)).data.organizations;
    const masterOrganizationId = organizations[0].id;

    const roles = (await request.get("/accounts/api/roles?offset=0&limit=500")).data.data;
    const teams = (await request.get(`/accounts/api/cs/organizations/${masterOrganizationId}/teams?offset=0&limit=500`)).data.data;

    // Applying teams scoped to master business group
    await createTeams(request, masterOrganizationId, masterOrganizationId, teams[0].team_id, accessManagement.teams, roles);

    // Applying teams scoped to business groups
    for (const businessGroup of accessManagement["business-groups"]) {
        const organizationId = _.find(organizations, function (organization) {
            return organization.name === businessGroup.name;
        }).id;

        await createTeams(request, masterOrganizationId, organizationId, teams[0].team_id, businessGroup.teams, roles);
    }
}