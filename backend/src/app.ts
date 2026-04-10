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

const app = express();

// --- Swagger Docs ---
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

// --- 1. Seguridad: Helmet con CSP ---
app.use(helmet());

// --- 2. CORS ---
const allowedOrigins = [
  ...env.FRONTEND_URL.split(','),
  ...env.ALLOWED_ORIGINS.split(','),
].map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: true, // Permitir TODO en cualquier entorno temporalmente para desbloquear al usuario
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// --- 3. Rate Limiting general ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// --- Pagos Webhook (Ahora usa JSON estándar como todos) ---
// app.use('/api/payments', paymentRoutes); -> lo moveremos abajo

// --- 4. Body Parser limit --
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// --- 5. HTTP Parameter Pollution ---
app.use(hpp());

// --- 6. Logging ---
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Servir estáticos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// --- Rutas Base ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), environment: env.NODE_ENV });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products/:productId/reviews', reviewRoutes); // Mounted reviews under products

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// --- Manejo Global de Errores ---
app.use(errorHandler);

export default app;
