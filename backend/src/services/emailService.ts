// ============================================================
// EMAIL SERVICE - Resend Integration
// ============================================================

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@belledesir.com';

export interface OrderData {
  id: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    country: string;
    zip: string;
    phone?: string;
  };
}

export async function sendOrderConfirmation(to: string, orderData: OrderData): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `¡Pedido confirmado - Belle Désir #${orderData.id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pedido Confirmado - Belle Désir</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #c4a8e8; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #5b2a86; }
            .order-info { background: #f8f5ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .product { border-bottom: 1px solid #eee; padding: 10px 0; }
            .product:last-child { border-bottom: none; }
            .total { font-weight: bold; font-size: 18px; color: #5b2a86; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
            .whatsapp { background: #25d366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Belle Désir</div>
              <h1>¡Pedido Confirmado!</h1>
            </div>
            
            <div class="order-info">
              <h2>Número de Orden: #${orderData.id}</h2>
              <p><strong>Estado:</strong> Confirmado y en procesamiento</p>
            </div>

            <h3>Productos Comprados:</h3>
            ${orderData.items.map(item => `
              <div class="product">
                <p><strong>${item.name}</strong></p>
                <p>Cantidad: ${item.quantity} | Precio: $${item.unitPrice.toLocaleString('es-CO')}</p>
              </div>
            `).join('')}

            <div class="total">
              <p>Total Pagado: $${orderData.total.toLocaleString('es-CO')}</p>
            </div>

            <h3>Dirección de Envío:</h3>
            <p>
              ${orderData.shippingAddress.name}<br>
              ${orderData.shippingAddress.address}<br>
              ${orderData.shippingAddress.city}, ${orderData.shippingAddress.country}<br>
              ${orderData.shippingAddress.zip}
              ${orderData.shippingAddress.phone ? `<br>Tel: ${orderData.shippingAddress.phone}` : ''}
            </p>

            <div class="footer">
              <p>Te avisaremos cuando tu pedido esté en camino</p>
              <p>¿Necesitas ayuda? Contáctanos por WhatsApp:</p>
              <a href="https://wa.me/573159739914" class="whatsapp">WhatsApp de Soporte</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Belle Désir - Conócete sin límites, sin juicios
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[EmailService] Error sending order confirmation:', error);
      throw error;
    }

    console.log('[EmailService] Order confirmation sent to:', to);
  } catch (error) {
    console.error('[EmailService] Failed to send order confirmation:', error);
    // No lanzar el error para no romper el flujo
  }
}

export async function sendPasswordReset(to: string, resetLink: string): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Recupera tu contraseña - Belle Désir',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperar Contraseña - Belle Désir</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #c4a8e8; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #5b2a86; }
            .reset-btn { background: #5b2a86; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Belle Désir</div>
              <h1>Recupera tu Contraseña</h1>
            </div>
            
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="reset-btn">Restablecer Contraseña</a>
            </div>
            
            <p><strong>Importante:</strong> Este enlace expirará en 1 hora por seguridad.</p>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.</p>

            <div class="footer">
              <p>Belle Désir - Conócete sin límites, sin juicios</p>
              <p>Si tienes problemas, contáctanos por WhatsApp: +57 315 973 9914</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[EmailService] Error sending password reset:', error);
      throw error;
    }

    console.log('[EmailService] Password reset sent to:', to);
  } catch (error) {
    console.error('[EmailService] Failed to send password reset:', error);
    // No lanzar el error para no romper el flujo
  }
}

export async function sendOrderStatusUpdate(to: string, orderData: OrderData, newStatus: string): Promise<void> {
  try {
    let subject: string;
    let statusMessage: string;
    let statusColor: string;

    switch (newStatus) {
      case 'SHIPPED':
        subject = `Tu pedido está en camino - Belle Désir #${orderData.id}`;
        statusMessage = 'Tu pedido ha sido enviado y está en camino';
        statusColor = '#2563eb';
        break;
      case 'DELIVERED':
        subject = `Tu pedido fue entregado - Belle Désir #${orderData.id}`;
        statusMessage = '¡Tu pedido ha sido entregado!';
        statusColor = '#16a34a';
        break;
      case 'PROCESSING':
        subject = `Tu pedido está en procesamiento - Belle Désir #${orderData.id}`;
        statusMessage = 'Tu pedido está siendo preparado';
        statusColor = '#ea580c';
        break;
      default:
        subject = `Actualización de tu pedido - Belle Désir #${orderData.id}`;
        statusMessage = `Tu pedido tiene una nueva actualización: ${newStatus}`;
        statusColor = '#6b7280';
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Actualización de Pedido - Belle Désir</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #c4a8e8; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #5b2a86; }
            .status-badge { background: ${statusColor}; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            .whatsapp { background: #25d366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Belle Désir</div>
              <h1>Actualización de tu Pedido</h1>
            </div>
            
            <h2>Número de Orden: #${orderData.id}</h2>
            
            <div style="text-align: center;">
              <div class="status-badge">${statusMessage}</div>
            </div>

            <h3>Resumen de tu Pedido:</h3>
            ${orderData.items.map(item => `
              <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p><strong>${item.name}</strong></p>
                <p>Cantidad: ${item.quantity} | Precio: $${item.unitPrice.toLocaleString('es-CO')}</p>
              </div>
            `).join('')}

            <div style="font-weight: bold; font-size: 18px; color: #5b2a86; margin-top: 20px;">
              <p>Total: $${orderData.total.toLocaleString('es-CO')}</p>
            </div>

            <div class="footer">
              <p>¿Necesitas ayuda con tu pedido?</p>
              <a href="https://wa.me/573159739914" class="whatsapp">WhatsApp de Soporte</a>
              <p style="margin-top: 20px;">
                Belle Désir - Conócete sin límites, sin juicios
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[EmailService] Error sending order status update:', error);
      throw error;
    }

    console.log(`[EmailService] Order status update (${newStatus}) sent to:`, to);
  } catch (error) {
    console.error('[EmailService] Failed to send order status update:', error);
    // No lanzar el error para no romper el flujo
  }
}
