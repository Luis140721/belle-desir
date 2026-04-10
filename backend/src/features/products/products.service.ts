import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { getPagination, getPagingData } from '../../shared/utils/pagination';
import { CreateProductInput, UpdateProductInput } from './products.schemas';

export class ProductService {
  static async getAll(query: any) {
    const { page, limit, category, search, minPrice, maxPrice, isFeatured, sortBy } = query;
    const { take, skip } = getPagination(page ? +page : 1, limit ? +limit : 10);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (category) {
      where.category = { slug: category as string };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { id: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'newest') orderBy = { id: 'desc' };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: getPagingData(total, page ? +page : 1, limit ? +limit : 10),
    };
  }

  static async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        reviews: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!product) throw new AppError('Product not found', 404);

    // Calculate avg rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / product.reviews.length
        : 0;

    return { ...product, avgRating };
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!product) throw new AppError('Product not found', 404);

    // Calculate avg rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / product.reviews.length
        : 0;

    return { ...product, avgRating };
  }

  static async create(data: CreateProductInput) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Check slug
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) throw new AppError('A product with a similar name already exists', 409);

    if (data.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (skuExists) throw new AppError('SKU already exists', 409);
    }

    return prisma.product.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  static async update(id: string, data: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    // Soft delete
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async addImages(id: string, imagePaths: string[]) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new AppError('Product not found', 404);

    const newImages = [...product.images, ...imagePaths].slice(0, 5); // Max 5

    return prisma.product.update({
      where: { id },
      data: { images: newImages },
    });
  }

  static async removeImage(id: string, imageUrl: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new AppError('Product not found', 404);

    const newImages = product.images.filter((img) => img !== imageUrl);

    return prisma.product.update({
      where: { id },
      data: { images: newImages },
    });
  }
}
