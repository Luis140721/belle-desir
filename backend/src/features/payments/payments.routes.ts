import { Router } from 'express';
import { handleWompiWebhook } from './wompi.webhook';
import { boldWebhookHandler } from './bold.webhook';

export const paymentRoutes = Router();

// Wompi webhook expects JSON, so app.js must have express.json() before it, 
// unlike stripe that needed raw. We let the general json parser handle it.
paymentRoutes.post('/webhook', handleWompiWebhook);
paymentRoutes.post('/bold-webhook', boldWebhookHandler);
