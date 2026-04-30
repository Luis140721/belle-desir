"use strict";
// ============================================================
// APP.TS — Configuración principal de Express
// Punto de entrada de middlewares, seguridad, CORS y rutas.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const hpp_1 = __importDefault(require("hpp"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = require("./features/auth/auth.routes");
const products_routes_1 = require("./features/products/products.routes");
const categories_routes_1 = require("./features/categories/categories.routes");
const cart_routes_1 = require("./features/cart/cart.routes");
const orders_routes_1 = require("./features/orders/orders.routes");
const payments_routes_1 = require("./features/payments/payments.routes");
const admin_routes_1 = require("./features/admin/admin.routes");
const reviews_routes_1 = require("./features/reviews/reviews.routes");
const multimedia_routes_js_1 = require("./features/multimedia/multimedia.routes.js");
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// ── Crear instancia de Express ───────────────────────────────
const app = (0, express_1.default)();
// ── Swagger Docs (solo en desarrollo) ────────────────────────
// Deshabilitado en producción para no exponer documentación de API
if (env_1.env.NODE_ENV !== 'production') {
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
    const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
}
// ── 1. Seguridad: Helmet ─────────────────────────────────────
// Helmet configura headers HTTP de seguridad (CSP, X-Frame, etc.)
app.use((0, helmet_1.default)());
// ── 2. CORS ──────────────────────────────────────────────────
// Podría fallar si FRONTEND_URL o ADMIN_URL tienen formato incorrecto
// (ej: trailing slash, espacios, protocolo incorrecto).
// Se usa callback(null, false) en vez de callback(new Error(...))
// para evitar que Express 5 devuelva 500 en preflight OPTIONS.
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
];
// Solo añadir si existen y no son strings vacíos
if (env_1.env.FRONTEND_URL)
    allowedOrigins.push(env_1.env.FRONTEND_URL);
if (env_1.env.ADMIN_URL)
    allowedOrigins.push(env_1.env.ADMIN_URL);
console.info('[CORS] Orígenes permitidos:', JSON.stringify(allowedOrigins));
app.use((0, cors_1.default)({
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
}));
// ── 3. Rate Limiting ─────────────────────────────────────────
// 100 peticiones por IP cada 15 minutos en todas las rutas /api
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// ── 4. Body Parser ───────────────────────────────────────────
// Limitar tamaño del body para prevenir ataques de payload grande
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// ── 5. HTTP Parameter Pollution ──────────────────────────────
app.use((0, hpp_1.default)());
// ── 6. Logging ───────────────────────────────────────────────
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// ── Archivos estáticos ───────────────────────────────────────
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ── Health Check ─────────────────────────────────────────────
// Usado por Render para verificar que el servidor está vivo
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), environment: env_1.env.NODE_ENV });
});
// ── Rutas de la API ──────────────────────────────────────────
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/products', products_routes_1.productRoutes);
app.use('/api/categories', categories_routes_1.categoryRoutes);
app.use('/api/cart', cart_routes_1.cartRoutes);
app.use('/api/orders', orders_routes_1.orderRoutes);
app.use('/api/payments', payments_routes_1.paymentRoutes);
app.use('/api/admin', admin_routes_1.adminRoutes);
app.use('/api/products/:productId/reviews', reviews_routes_1.reviewRoutes);
app.use('/api/multimedia', multimedia_routes_js_1.multimediaRoutes);
// ── Manejo de rutas no encontradas ───────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});
// ── Manejo Global de Errores ─────────────────────────────────
app.use(errorHandler_1.errorHandler);
exports.default = app;
