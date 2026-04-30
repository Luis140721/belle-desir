"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const bold_webhook_1 = require("./bold.webhook");
exports.paymentRoutes = (0, express_1.Router)();
// Bold Colombia webhook
exports.paymentRoutes.post('/bold-webhook', bold_webhook_1.boldWebhookHandler);
