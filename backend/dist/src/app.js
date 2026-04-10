"use strict";
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
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const app = (0, express_1.default)();
// --- Swagger Docs ---
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
// --- 1. Seguridad: Helmet con CSP ---
app.use((0, helmet_1.default)());
// --- 2. CORS ---
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// --- 3. Rate Limiting general ---
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// --- Pagos Webhook (Ahora usa JSON estándar como todos) ---
// app.use('/api/payments', paymentRoutes); -> lo moveremos abajo
// --- 4. Body Parser limit --
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// --- 5. HTTP Parameter Pollution ---
app.use((0, hpp_1.default)());
// --- 6. Logging ---
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Servir estáticos
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// --- Rutas Base ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date(), environment: env_1.env.NODE_ENV });
});
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/products', products_routes_1.productRoutes);
app.use('/api/categories', categories_routes_1.categoryRoutes);
app.use('/api/cart', cart_routes_1.cartRoutes);
app.use('/api/orders', orders_routes_1.orderRoutes);
app.use('/api/payments', payments_routes_1.paymentRoutes);
app.use('/api/admin', admin_routes_1.adminRoutes);
app.use('/api/products/:productId/reviews', reviews_routes_1.reviewRoutes); // Mounted reviews under products
// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});
// --- Manejo Global de Errores ---
app.use(errorHandler_1.errorHandler);
exports.default = app;
