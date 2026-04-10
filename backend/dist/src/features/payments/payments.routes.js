"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const wompi_webhook_1 = require("./wompi.webhook");
const bold_webhook_1 = require("./bold.webhook");
exports.paymentRoutes = (0, express_1.Router)();
// Wompi webhook expects JSON, so app.js must have express.json() before it, 
// unlike stripe that needed raw. We let the general json parser handle it.
exports.paymentRoutes.post('/webhook', wompi_webhook_1.handleWompiWebhook);
exports.paymentRoutes.post('/bold-webhook', bold_webhook_1.boldWebhookHandler);
