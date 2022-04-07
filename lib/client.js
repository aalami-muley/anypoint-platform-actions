"use strict";

const axios = require("axios");
const BASE_URL = process.env.BASE_URL || "https://eu1.anypoint.mulesoft.com/";

module.exports = {
    get(credentials) {
        let headers = {
            'Authorization': `Bearer ${credentials.token}`,
            "Accept": "application/json",
            "x-origin": "API Designer",
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip, deflate, br"
        };

        if (credentials.organizationId) {
            headers["x-organization-id"] = credentials.organizationId;
        }

        if (credentials.userId) {
            headers["x-owner-id"] = credentials.userId;
        }

        return axios.create({
            baseURL: BASE_URL,
            timeout: 10000,
            headers
        });;
    }
};