import { prisma } from '../../config/database.js';
import { MediaType } from '@prisma/client';

export const multimediaService = {
  async getAll(filters: any) {
    const { page, section, type, isActive } = filters;
    return prisma.multimediaContent.findMany({
      where: {
        ...(page && { page }),
        ...(section && { section }),
        ...(type && { type: type as MediaType }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      },
      orderBy: {
        priority: 'asc',
      },
    });
  },

  async getById(id: string) {
    return prisma.multimediaContent.findUnique({
      where: { id },
    });
  },

  async create(data: any) {
    return prisma.multimediaContent.create({
      data,
    });
  },

  async update(id: string, data: any) {
    return prisma.multimediaContent.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.multimediaContent.delete({
      where: { id },
    });
  },

  async getByPageAndSection(page: string, section: string) {
    return prisma.multimediaContent.findMany({
      where: {
        page,
        section,
        isActive: true,
      },
      orderBy: {
        priority: 'asc',
      },
    });
  }
};
