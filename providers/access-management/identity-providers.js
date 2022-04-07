"use strict";

const _ = require("lodash");

const { warn, info } = require("../../lib/logger");

const LOGGER_NAME = "[access-management][identity-providers]";

const TYPES = {
    "saml": {
        "description": "SAML 2.0",
        "name": "saml"
    },
    "openid": {
        "description": "OpenID Connect",
        "name": "openid"
    }
}

const PROFILES = {
    "azure": {
        "saml": {
            "claims_mapping": {
                "email_attribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
                "group_attribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/groups",
                "lastname_attribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
                "username_attribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
                "firstname_attribute": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
            },
            "sp_initiated_sso_enabled": true,
            "idp_initiated_sso_enabled": true,
            "require_encrypted_saml_assertions": false
        },
        "service_provider": {
            "urls": {
                "sign_on": "https://login.microsoftonline.com/deff24bb-2089-4400-8c8e-f71e680378b2/saml2",
                "sign_out": "https://login.microsoftonline.com/deff24bb-2089-4400-8c8e-f71e680378b2/saml2"
            }
        }
    }
}

function getData(profile, type, { name, saml, service_provider }) {

    saml = _.defaults(saml, PROFILES[profile].saml);
    return {
        "type": TYPES[type],
        "service_provider": service_provider || PROFILES[profile].service_provider,
        saml,
        name
    };
}

async function createIdentityProviders(request, org_id, identityProviders) {
    const existingIdentityProviders = (await request.get(`/accounts/api/organizations/${org_id}/identityProviders`)).data.data;

    for (const identityProvider of identityProviders || []) {
        if (!_.find(existingIdentityProviders, function (provider) {
            return provider.name === identityProvider.name;
        })) {
            const type = (identityProvider.saml) ? "saml" : "openid";
            const data = getData(identityProvider.profile, type, identityProvider);
            (await request.post(`/accounts/api/organizations/${org_id}/identityProviders`, data));
            info(`${LOGGER_NAME} Identity provider with name ${identityProvider.name} is successfully created.`);
        } else {
            warn(`${LOGGER_NAME} Identity provider with name ${identityProvider.name} is already created.`);
        }
    }
}

module.exports = async function (request, identityProviders) {
    const organizations = (await request.get(`/accounts/api/v2/cs`)).data.organizations;
    await createIdentityProviders(request, organizations[0].id, identityProviders);
}