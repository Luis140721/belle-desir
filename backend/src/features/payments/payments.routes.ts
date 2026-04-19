import { Router } from 'express';
import { boldWebhookHandler } from './bold.webhook';

export const paymentRoutes = Router();

// Bold Colombia webhook
paymentRoutes.post('/bold-webhook', boldWebhookHandler);
