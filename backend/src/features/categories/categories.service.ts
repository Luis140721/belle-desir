import { prisma } from '../../config/database';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schemas';
import { AppError } from '../../shared/errors/AppError';

export class CategoryService {
  static async getAll() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
  }

  static async getBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug }
    });
    if (!category) throw new AppError('Category not found', 404);
    return category;
  }

  static async create(data: CreateCategoryInput) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) throw new AppError('Category with similar name already exists', 409);

    return prisma.category.create({
      data: { ...data, slug }
    });
  }

  static async update(id: number, data: UpdateCategoryInput) {
    return prisma.category.update({
      where: { id },
      data
    });
  }

  static async delete(id: number) {
    const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } }});
    if (!category) throw new AppError('Category not found', 404);
    if (category._count.products > 0) throw new AppError('Cannot delete category with products', 400);

    return prisma.category.delete({ where: { id } });
  }
}
