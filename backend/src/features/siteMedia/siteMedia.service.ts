import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { UpsertSiteMediaInput, UpdateSiteMediaInput } from './siteMedia.schemas';

export class SiteMediaService {
  static async publicList() {
    return prisma.siteMedia.findMany({
      where: { isActive: true },
      orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  static async adminList() {
    return prisma.siteMedia.findMany({
      orderBy: [{ placement: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  static async create(data: UpsertSiteMediaInput) {
    return prisma.siteMedia.create({
      data: normalizeCreatePayload(data),
    });
  }

  static async update(id: string, data: UpdateSiteMediaInput) {
    const existing = await prisma.siteMedia.findUnique({ where: { id } });
    if (!existing) throw new AppError('Media item not found', 404);

    return prisma.siteMedia.update({
      where: { id },
      data: normalizeUpdatePayload(data),
    });
  }

  static async delete(id: string) {
    const existing = await prisma.siteMedia.findUnique({ where: { id } });
    if (!existing) throw new AppError('Media item not found', 404);
    await prisma.siteMedia.delete({ where: { id } });
    return { message: 'Media item deleted' };
  }
}

function normalizeCreatePayload(data: UpsertSiteMediaInput) {
  return {
    ...data,
    subtitle: data.subtitle || null,
    posterUrl: data.posterUrl || null,
    altText: data.altText || null,
  };
}

function normalizeUpdatePayload(data: UpdateSiteMediaInput) {
  return {
    ...data,
    ...(data.subtitle !== undefined ? { subtitle: data.subtitle || null } : {}),
    ...(data.posterUrl !== undefined ? { posterUrl: data.posterUrl || null } : {}),
    ...(data.altText !== undefined ? { altText: data.altText || null } : {}),
  };
}
