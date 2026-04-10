"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const database_1 = require("../../config/database");
const AppError_1 = require("../../shared/errors/AppError");
class CartService {
    static async getCart(userId) {
        let cart = await database_1.prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, price: true, images: true, stock: true },
                        },
                    },
                    orderBy: { id: 'asc' },
                },
            },
        });
        if (!cart) {
            cart = await database_1.prisma.cart.create({
                data: { userId },
                include: { items: { include: { product: true } } },
            });
        }
        return cart;
    }
    static async addItem(userId, data) {
        // Validar stock real del producto antes de agregar al carrito
        const product = await database_1.prisma.product.findUnique({ where: { id: data.productId } });
        if (!product || !product.isActive) {
            throw new AppError_1.AppError('Product not found or inactive', 404);
        }
        // Validar stock disponible
        if (product.stock === 0) {
            throw new AppError_1.AppError('Producto agotado', 400);
        }
        let cart = await database_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await database_1.prisma.cart.create({ data: { userId } });
        }
        const existingItem = await database_1.prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId: data.productId },
        });
        const totalQuantity = (existingItem?.quantity || 0) + data.quantity;
        if (totalQuantity > product.stock) {
            throw new AppError_1.AppError(`Stock insuficiente. Solo ${product.stock} unidades disponibles.`, 400);
        }
        if (existingItem) {
            await database_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: totalQuantity },
            });
        }
        else {
            await database_1.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: data.productId,
                    quantity: data.quantity,
                },
            });
        }
        return this.getCart(userId);
    }
    static async updateItem(userId, productId, data) {
        const cart = await database_1.prisma.cart.findUnique({ where: { userId } });
        if (!cart)
            throw new AppError_1.AppError('Cart not found', 404);
        const existingItem = await database_1.prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId },
            include: { product: true },
        });
        if (!existingItem)
            throw new AppError_1.AppError('Item not in cart', 404);
        if (data.quantity === 0) {
            await database_1.prisma.cartItem.delete({ where: { id: existingItem.id } });
        }
        else {
            if (existingItem.product.stock === 0) {
                throw new AppError_1.AppError('Producto agotado', 400);
            }
            if (data.quantity > existingItem.product.stock) {
                throw new AppError_1.AppError(`Stock insuficiente. Solo ${existingItem.product.stock} unidades disponibles.`, 400);
            }
            await database_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: data.quantity },
            });
        }
        return this.getCart(userId);
    }
    static async clearCart(userId) {
        const cart = await database_1.prisma.cart.findUnique({ where: { userId } });
        if (cart) {
            await database_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
        return { message: 'Cart cleared' };
    }
}
exports.CartService = CartService;
