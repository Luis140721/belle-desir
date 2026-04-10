import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { CartItemInput, UpdateCartItemInput } from './cart.schemas';

export class CartService {
  static async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
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
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
    }

    return cart;
  }

  static async addItem(userId: string, data: CartItemInput) {
    // Validar stock real del producto antes de agregar al carrito
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product || !product.isActive) {
      throw new AppError('Product not found or inactive', 404);
    }

    // Validar stock disponible
    if (product.stock === 0) {
      throw new AppError('Producto agotado', 400);
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: data.productId },
    });

    const totalQuantity = (existingItem?.quantity || 0) + data.quantity;
    if (totalQuantity > product.stock) {
      throw new AppError(`Stock insuficiente. Solo ${product.stock} unidades disponibles.`, 400);
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: totalQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          quantity: data.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  static async updateItem(userId: string, productId: string, data: UpdateCartItemInput) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('Cart not found', 404);

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
      include: { product: true },
    });

    if (!existingItem) throw new AppError('Item not in cart', 404);

    if (data.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
    } else {
      if (existingItem.product.stock === 0) {
        throw new AppError('Producto agotado', 400);
      }
      if (data.quantity > existingItem.product.stock) {
        throw new AppError(`Stock insuficiente. Solo ${existingItem.product.stock} unidades disponibles.`, 400);
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: data.quantity },
      });
    }

    return this.getCart(userId);
  }

  static async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared' };
  }
}
