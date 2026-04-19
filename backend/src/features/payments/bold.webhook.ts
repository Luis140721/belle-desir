// ============================================================
// BOLD WEBHOOK HANDLER — Procesamiento de notificaciones de pago
// Bold envía POSTs automáticos cuando un pago se aprueba/rechaza.
//
// PUNTOS DE FALLA POSIBLES:
// - Bold envía un payload con estructura inesperada
// - La orden referenciada no existe en la base de datos
// - La transacción de Prisma falla (concurrencia, DB caída)
// - El servicio de email falla al notificar (no debe romper el flujo)
//
// REGLA IMPORTANTE: Siempre responder 200 a Bold.
// Si respondemos 4xx/5xx, Bold reintenta y podría duplicar operaciones.
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { sendOrderStatusUpdate, OrderData } from '../../services/emailService.js';

/**
 * boldWebhookHandler
 * Procesa notificaciones de transacciones de Bold Colombia.
 * Actualiza el estado de la orden y el stock según el resultado del pago.
 *
 * @param req - Request con body { transaction: { status, order_reference } }
 * @param res - Response — siempre devuelve 200 para evitar reintentos
 */
export const boldWebhookHandler = async (req: Request, res: Response) => {
  console.info('[BoldWebhook] Webhook recibido. Procesando notificación de pago...');

  try {
    // ── Paso 1: Extraer datos de la transacción ──────────────
    // Podría fallar si Bold cambia la estructura del payload
    const { transaction } = req.body;

    if (!transaction) {
      console.warn('[BoldWebhook] Payload sin campo "transaction". Posible ping de Bold.');
      return res.status(200).json({ received: true });
    }

    const { status, order_reference } = transaction;
    console.info('[BoldWebhook] Transacción recibida — Estado: ' + status + ' | Orden: ' + (order_reference || 'N/A'));

    if (!order_reference) {
      console.warn('[BoldWebhook] Transacción sin order_reference. No se puede procesar.');
      return res.status(200).json({ received: true });
    }

    // ── Paso 2: Procesar según estado ────────────────────────
    if (status === 'APPROVED') {
      console.info('[BoldWebhook] Pago APROBADO para orden ' + order_reference + '. Actualizando...');

      try {
        await prisma.$transaction(async (tx) => {
          // Verificar que la orden no esté ya pagada (idempotencia).
          // Podría fallar si la orden no existe en la DB.
          console.info('[BoldWebhook] Verificando estado actual de la orden...');
          const currentOrder = await tx.order.findUnique({ where: { id: order_reference } });

          if (!currentOrder) {
            console.error('[BoldWebhook] ❌ Orden ' + order_reference + ' NO encontrada en la base de datos');
            return;
          }

          if (currentOrder.status === 'PAID') {
            console.info('[BoldWebhook] Orden ' + order_reference + ' ya está PAID. Ignorando duplicado.');
            return;
          }

          // Actualizar estado a PAID
          console.info('[BoldWebhook] Cambiando estado de orden a PAID...');
          const order = await tx.order.update({
            where: { id: order_reference },
            data: { status: 'PAID' },
            include: { items: true },
          });

          // Reducir stock de cada producto.
          // Podría fallar si el stock ya es 0 (decrement en negativo).
          console.info('[BoldWebhook] Actualizando stock de ' + order.items.length + ' productos...');
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }

          // Enviar email de confirmación de pago.
          // Si falla, NO debe romper la transacción — el pago ya se procesó.
          console.info('[BoldWebhook] Enviando email de confirmación...');
          try {
            const user = await tx.user.findUnique({ where: { id: order.userId } });
            if (user?.email) {
              const orderData: OrderData = {
                id: order.id,
                items: order.items.map((item: any) => ({
                  name: (item.productSnapshot as any).name as string,
                  quantity: item.quantity,
                  unitPrice: Number(item.unitPrice),
                })),
                total: Number(order.total),
                shippingAddress: order.shippingAddress as any,
              };
              await sendOrderStatusUpdate(user.email, orderData, 'PAID');
              console.info('[BoldWebhook] ✅ Email de confirmación enviado a ' + user.email);
            }
          } catch (emailError) {
            // Warning, no Error — el pago se procesó correctamente
            console.warn('[BoldWebhook] ⚠️ No se pudo enviar email de confirmación:', emailError);
          }
        });

        console.info('[BoldWebhook] ✅ Orden ' + order_reference + ' marcada como PAID exitosamente');

      } catch (dbError) {
        console.error('[BoldWebhook] ❌ Error al procesar pago aprobado para orden ' + order_reference);
        console.error('[BoldWebhook] Esto significa que Bold aprobó el pago pero no pudimos actualizar la DB.');
        console.error('[BoldWebhook] ACCIÓN REQUERIDA: Actualizar manualmente la orden desde el admin.');
        console.error('[BoldWebhook] Error técnico:', dbError);
      }

    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(status)) {
      console.info('[BoldWebhook] Pago RECHAZADO/ANULADO (' + status + ') para orden ' + order_reference);

      try {
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: order_reference },
            include: { items: true },
          });

          if (!order) {
            console.warn('[BoldWebhook] Orden ' + order_reference + ' no encontrada. Puede que ya fue eliminada.');
            return;
          }

          if (order.status === 'CANCELLED') {
            console.info('[BoldWebhook] Orden ' + order_reference + ' ya está CANCELLED. Ignorando.');
            return;
          }

          // Si la orden estaba PAID, devolver stock
          if (order.status === 'PAID') {
            console.info('[BoldWebhook] Orden estaba PAID → devolviendo stock...');
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
            console.info('[BoldWebhook] ✅ Stock devuelto para ' + order.items.length + ' productos');
          }

          // Marcar como CANCELLED
          await tx.order.update({
            where: { id: order_reference },
            data: { status: 'CANCELLED' },
          });
        });

        console.info('[BoldWebhook] ✅ Orden ' + order_reference + ' marcada como CANCELLED');

      } catch (dbError) {
        console.error('[BoldWebhook] ❌ Error al cancelar orden ' + order_reference);
        console.error('[BoldWebhook] ACCIÓN REQUERIDA: Cancelar manualmente desde el admin.');
        console.error('[BoldWebhook] Error técnico:', dbError);
      }

    } else {
      // Estados no manejados (ej: PENDING) — solo loguear
      console.info('[BoldWebhook] Estado no procesable: ' + status + '. Ignorando.');
    }

    // ── Siempre responder 200 ────────────────────────────────
    // Bold interpreta cualquier otra respuesta como fallo y reintenta.
    return res.status(200).json({ received: true });

  } catch (error) {
    // ── Error inesperado (estructura del payload, crash, etc.) ──
    console.error('[BoldWebhook] ❌ Error inesperado procesando webhook:', error);
    // IMPORTANTE: Aún así respondemos 200 para que Bold no reintente
    return res.status(200).json({ received: true });
  }
};
