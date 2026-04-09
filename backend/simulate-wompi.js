const crypto = require('crypto');
const http = require('http');
require('dotenv').config();

const orderId = process.argv[2];

if (!orderId) {
  console.error('Por favor, proporciona el ID de la orden. Ejemplo: node simulate-wompi.js <ORDER_ID>');
  process.exit(1);
}

const secret = process.env.WOMPI_EVENTS_SECRET || 'events_...';
const timestamp = Math.floor(Date.now() / 1000).toString();

const payload = {
  event: 'transaction.updated',
  data: {
    transaction: {
      id: 'trt_test_12345',
      status: 'APPROVED',
      amount_in_cents: 1000000,
      reference: orderId,
    }
  },
  timestamp: timestamp,
  signature: {
    properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents']
  }
};

// Generar Hash exacto como espera el webhook: trt_test_12345APPROVED1000000 + timestamp + secret
const concatenatedString = `trt_test_12345APPROVED1000000${timestamp}${secret}`;
payload.signature.checksum = crypto.createHash('sha256').update(concatenatedString).digest('hex');

const data = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/payments/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`Estado Wompi Webhook: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
  console.log('\n¡El Webhook de Wompi de prueba fue ejecutado con éxito!');
});

req.on('error', error => {
  console.error('Error al simular pago Wompi:', error);
});

req.write(data);
req.end();
