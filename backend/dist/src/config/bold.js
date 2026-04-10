"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoldHeaders = exports.BOLD_API_URL = void 0;
const env_1 = require("./env");
exports.BOLD_API_URL = 'https://integrations.api.bold.co';
const getBoldHeaders = () => ({
    Authorization: `x-api-key ${env_1.env.BOLD_API_KEY}`,
    'Content-Type': 'application/json',
});
exports.getBoldHeaders = getBoldHeaders;
