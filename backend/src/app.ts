// ============================================================
// APP.TS — Configuración principal de Express
// Punto de entrada de middlewares, seguridad, CORS y rutas.
// ============================================================

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './features/auth/auth.routes';
import { productRoutes } from './features/products/products.routes';
import { categoryRoutes } from './features/categories/categories.routes';
import { cartRoutes } from './features/cart/cart.routes';
import { orderRoutes } from './features/orders/orders.routes';
import { paymentRoutes } from './features/payments/payments.routes';
import { adminRoutes } from './features/admin/admin.routes';
import { reviewRoutes } from './features/reviews/reviews.routes';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// ── Crear instancia de Express ───────────────────────────────
const app = express();

// ── Swagger Docs (solo en desarrollo) ────────────────────────
// Deshabilitado en producción para no exponer documentación de API
if (env.NODE_ENV !== 'production') {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: { title: 'Belle Désir API', version: '1.0.0' },
      servers: [
        { url: '/api', description: 'Local server' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
    apis: ['./src/features/**/*.controller.ts', './src/features/**/*.routes.ts'],
  };
  const swaggerSpec = swaggerJsDoc(swaggerOptions);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ── 1. Seguridad: Helmet ─────────────────────────────────────
// Helmet configura headers HTTP de seguridad (CSP, X-Frame, etc.)
app.use(helmet());

// ── 2. CORS ──────────────────────────────────────────────────
// Podría fallar si FRONTEND_URL o ADMIN_URL tienen formato incorrecto
// (ej: trailing slash, espacios, protocolo incorrecto).
// Se usa callback(null, false) en vez de callback(new Error(...))
// para evitar que Express 5 devuelva 500 en preflight OPTIONS.
const allowedOrigins: string[] = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

// Solo añadir si existen y no son strings vacíos
if (env.FRONTEND_URL) allowedOrigins.push(env.FRONTEND_URL);
if (env.ADMIN_URL) allowedOrigins.push(env.ADMIN_URL);

console.info('[CORS] Orígenes permitidos:', JSON.stringify(allowedOrigins));

app.use(
  cors({
    origin: function (origin, callback) {
      // Peticiones sin origin (curl, Postman, health checks) siempre pasan
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      // Denegar sin lanzar Error (evita 500 en OPTIONS preflight)
      console.warn('[CORS] Origen bloqueado: ' + origin);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── 3. Rate Limiting ─────────────────────────────────────────
// 100 peticiones por IP cada 15 minutos en todas las rutas /api
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── 4. Body Parser ───────────────────────────────────────────
// Limitar tamaño del body para prevenir ataques de payload grande
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── 5. HTTP Parameter Pollution ──────────────────────────────
app.use(hpp());

// ── 6. Logging ───────────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Archivos estáticos ───────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Health Check ─────────────────────────────────────────────
// Usado por Render para verificar que el servidor está vivo
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), environment: env.NODE_ENV });
});

// ── Rutas de la API ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products/:productId/reviews', reviewRoutes);

// ── Manejo de rutas no encontradas ───────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// ── Manejo Global de Errores ─────────────────────────────────
app.use(errorHandler);

export default app;
