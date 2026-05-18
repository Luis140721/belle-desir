import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env';
import { OrderService } from '../orders/orders.service';

export const boldWebhookHandler = async (req: Request, res: Response) => {
  console.info('[BoldWebhook] Webhook recibido.');

  try {
    if (!isValidBoldSignature(req)) {
      console.warn('[BoldWebhook] Firma invalida. Se ignora el evento.');
      return res.status(200).json({ received: true });
    }

    const parsed = await OrderService.applyBoldNotification(req.body);

    console.info('[BoldWebhook] Evento procesado', {
      orderId: parsed.orderId,
      boldStatus: parsed.boldStatus,
      transactionId: parsed.transactionId,
      rawStatus: parsed.rawStatus,
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[BoldWebhook] Error inesperado procesando webhook:', error);
    return res.status(200).json({ received: true });
  }
};

function isValidBoldSignature(req: Request): boolean {
  const receivedSignature = req.header('x-bold-signature');

  if (!receivedSignature) return true;
  if (env.NODE_ENV !== 'production' && env.BOLD_WEBHOOK_SECRET === undefined) return true;

  const secret = env.BOLD_WEBHOOK_SECRET ?? '';
  const raw = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body ?? {});
  const encoded = Buffer.from(raw, 'utf8').toString('base64');
  const calculated = crypto
    .createHmac('sha256', secret)
    .update(encoded)
    .digest('hex');

  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(calculated);

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}
