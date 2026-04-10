"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
const env_1 = require("../../config/env");
const pagination_1 = require("../../shared/utils/pagination");
const axios_1 = __importDefault(require("axios"));
const bold_1 = require("../../config/bold");
const emailService_1 = require("../../services/emailService");
class OrderService {
    /**
     * Crea una orden.
     *
     * - Si userId está presente (usuario autenticado) toma los ítems del
     *   carrito en base de datos (y opcionalmente los del body).
     * - Si userId es null (invitado) los ítems DEBEN llegar en data.items.
     */
    static async createOrder(userId, data) {
        // ── 1. Resolver los ítems ────────────────────────────────
        let resolvedItems = [];
        if (userId) {
            // Usuario autenticado: intenta tomar del carrito DB
            const cart = await database_1.prisma.cart.findUnique({
                where: { userId },
                include: { items: true },
            });
            if (cart && cart.items.length > 0) {
                resolvedItems = cart.items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                }));
            }
            else if (data.items?.length) {
                // Carrito DB vacío pero el front envió items (respaldo)
                resolvedItems = data.items;
            }
            else {
                throw new AppError_1.AppError('El carrito está vacío', 400);
            }
        }
        else {
            // Invitado: los items son obligatorios en el body
            if (!data.items?.length) {
                throw new AppError_1.AppError('Se requieren los ítems del carrito', 400);
            }
            resolvedItems = data.items;
        }
        // ── 2. Validar stock y calcular totales ──────────────────
        const products = await database_1.prisma.product.findMany({
            where: { id: { in: resolvedItems.map((i) => i.productId) }, isActive: true },
        });
        if (products.length !== resolvedItems.length) {
            throw new AppError_1.AppError('Uno o más productos no están disponibles', 400);
        }
        // Validar stock de TODOS los items antes de crear la orden
        for (const item of resolvedItems) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new AppError_1.AppError(`Producto ${item.productId} no encontrado`, 400);
            }
            if (product.stock === 0) {
                throw new AppError_1.AppError(`Producto "${product.name}" está agotado`, 400);
            }
            if (item.quantity > product.stock) {
                throw new AppError_1.AppError(`Stock insuficiente para "${product.name}". Solo ${product.stock} unidades disponibles.`, 400);
            }
        }
        const subtotal = resolvedItems.reduce((sum, item) => {
            const product = products.find((p) => p.id === item.productId);
            return sum + Number(product.price) * item.quantity;
        }, 0);
        const shipping = subtotal > 150000 ? 0 : 15000;
        const total = subtotal + shipping;
        // ── 3. Crear la orden en transacción ─────────────────────
        // Para invitados guardamos sus datos en shippingAddress
        const shippingAddressData = {
            ...data.shippingAddress,
            // Ciudad y país fijos — la tienda solo despacha en Bogotá, Colombia
            city: 'Bogotá',
            country: 'Colombia',
            zip: data.shippingAddress.zip || '000000',
            // Enriquecemos con datos del invitado si no vienen en shippingAddress
            email: data.shippingAddress.email ?? data.guestEmail,
            name: data.shippingAddress.name || data.guestName || 'Invitado',
            phone: data.shippingAddress.phone || data.guestPhone,
        };
        const order = await database_1.prisma.$transaction(async (tx) => {
            // Para invitados necesitamos un userId-nullable o creamos usuario fantasma.
            // Nuestra estrategia: creamos un usuario guest en cada orden.
            // Si el email ya pertenece a un usuario real, lo vinculamos.
            let effectiveUserId = userId;
            if (!effectiveUserId) {
                const guestEmail = data.guestEmail ?? shippingAddressData.email;
                if (!guestEmail) {
                    throw new AppError_1.AppError('Se requiere un email para procesar el pedido', 400);
                }
                // Busca si ya existe un usuario con ese email
                let guestUser = await tx.user.findUnique({ where: { email: guestEmail } });
                if (!guestUser) {
                    // Crea un usuario guest con contraseña aleatoria (nunca podrán loguearse
                    // con ella a menos que hagan "olvidé mi contraseña")
                    const { randomBytes } = await Promise.resolve().then(() => __importStar(require('crypto')));
                    const randomPassword = randomBytes(32).toString('hex');
                    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcryptjs')));
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);
                    guestUser = await tx.user.create({
                        data: {
                            email: guestEmail,
                            name: shippingAddressData.name,
                            password: hashedPassword,
                            phone: shippingAddressData.phone ?? null,
                        },
                    });
                }
                effectiveUserId = guestUser.id;
            }
            const newOrder = await tx.order.create({
                data: {
                    userId: effectiveUserId,
                    status: 'PENDING',
                    subtotal,
                    shipping,
                    total,
                    shippingAddress: shippingAddressData,
                    items: {
                        create: resolvedItems.map((item) => {
                            const product = products.find((p) => p.id === item.productId);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: product.price,
                                productSnapshot: { ...product },
                            };
                        }),
                    },
                },
                include: { items: true },
            });
            // Vacía el carrito DB si el usuario está autenticado
            if (userId) {
                const cart = await tx.cart.findUnique({ where: { userId } });
                if (cart) {
                    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
                }
            }
            return newOrder;
        });
        // 4. Enviar email de confirmación de orden
        const orderData = {
            id: order.id,
            items: order.items.map(item => ({
                name: item.productSnapshot.name,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
            })),
            total: Number(order.total),
            shippingAddress: {
                ...shippingAddressData,
                zip: shippingAddressData.zip || '000000',
            },
        };
        // Obtener email del usuario
        const userEmail = userId
            ? (await database_1.prisma.user.findUnique({ where: { id: userId } }))?.email
            : data.guestEmail || shippingAddressData.email;
        if (userEmail) {
            await (0, emailService_1.sendOrderConfirmation)(userEmail, orderData);
        }
        // 5. Generar link de pago Bold ─────────────────────────
        const boldPayload = {
            amount_type: 'CLOSE',
            amount: {
                currency: 'COP',
                total_amount: Math.floor(total),
                tip_amount: 0,
            },
            reference: order.id,
            description: `Pedido Belle Désir #${order.id.slice(0, 8).toUpperCase()}`,
            expiration_date: Math.floor((Date.now() + 30 * 60 * 1000) * 1e6),
            payment_methods: ['CREDIT_CARD', 'PSE', 'NEQUI', 'BOTON_BANCOLOMBIA'],
            callback_url: `${env_1.env.FRONTEND_URL.split(',')[0]}/pedido-confirmado`,
        };
        try {
            const { data: boldResponse } = await axios_1.default.post(`${bold_1.BOLD_API_URL}/online/link/v1`, boldPayload, { headers: (0, bold_1.getBoldHeaders)() });
            const paymentLink = boldResponse.payload.payment_link;
            const checkoutUrl = boldResponse.payload.url;
            // Guardar el link en stripeSessionId (reutilizando campo)
            await database_1.prisma.order.update({
                where: { id: order.id },
                data: { stripeSessionId: paymentLink },
            });
            return {
                orderId: order.id,
                checkoutUrl,
                paymentLink,
            };
        }
        catch (error) {
            console.error('Error generating Bold payment link', {
                orderId: order.id,
                message: error?.message,
                status: error?.response?.status,
                responseData: error?.response?.data,
                responseHeaders: error?.response?.headers,
                requestUrl: `${bold_1.BOLD_API_URL}/online/link/v1`,
                requestPayload: boldPayload,
            });
            return {
                orderId: order.id,
                checkoutUrl: null,
                paymentLink: null,
            };
        }
    }
    static async getUserOrders(userId, query) {
        const { page, limit } = query;
        const { take, skip } = (0, pagination_1.getPagination)(page ? +page : 1, limit ? +limit : 10);
        const [orders, total] = await database_1.prisma.$transaction([
            database_1.prisma.order.findMany({
                where: { userId },
                take, skip,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.prisma.order.count({ where: { userId } }),
        ]);
        return { data: orders, meta: (0, pagination_1.getPagingData)(total, page ? +page : 1, limit ? +limit : 10) };
    }
    static async getOrderById(userId, orderId, role) {
        const order = await database_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            throw new AppError_1.AppError('Order not found', 404);
        if (order.userId !== userId && role !== 'ADMIN')
            throw new AppError_1.AppError('Unauthorized', 403);
        return order;
    }
    static async getAdminOrders(query) {
        const { page, limit, status, userId } = query;
        const { take, skip } = (0, pagination_1.getPagination)(page ? +page : 1, limit ? +limit : 10);
        const where = {};
        if (status)
            where.status = status;
        if (userId)
            where.userId = userId;
        const [orders, total] = await database_1.prisma.$transaction([
            database_1.prisma.order.findMany({
                where, take, skip,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { email: true, name: true } } },
            }),
            database_1.prisma.order.count({ where }),
        ]);
        return { data: orders, meta: (0, pagination_1.getPagingData)(total, page ? +page : 1, limit ? +limit : 10) };
    }
    static async updateOrderStatus(orderId, data) {
        const order = await database_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            throw new AppError_1.AppError('Order not found', 404);
        // Si el nuevo estado es el mismo, no hacer nada
        if (order.status === data.status)
            return order;
        return await database_1.prisma.$transaction(async (tx) => {
            // Caso 1: La orden pasa de PAID a CANCELLED o REFUNDED -> Devolvemos stock
            if (order.status === 'PAID' && ['CANCELLED', 'REFUNDED'].includes(data.status)) {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
            }
            // Caso 2: La orden pasa de PENDING/CANCELLED a PAID -> Reducimos stock
            // (Útil para cambios manuales del admin)
            if (order.status !== 'PAID' && data.status === 'PAID') {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }
            }
            return tx.order.update({
                where: { id: orderId },
                data: { status: data.status },
            });
        });
    }
}
exports.OrderService = OrderService;
