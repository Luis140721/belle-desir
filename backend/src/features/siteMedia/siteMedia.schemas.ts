import { z } from 'zod';

export const mediaPlacements = [
  'HERO_BACKGROUND',
  'CATALOG_SUPPORT',
  'ABOUT_SUPPORT',
  'CONTACT_SUPPORT',
  'CUBE_FACE',
] as const;

export const mediaTypes = ['IMAGE', 'VIDEO'] as const;

const siteMediaBodySchema = z.object({
  placement: z.enum(mediaPlacements),
  type: z.enum(mediaTypes),
  title: z.string().min(2),
  subtitle: z.string().optional().nullable(),
  url: z.string().url(),
  posterUrl: z.string().url().optional().nullable(),
  altText: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const upsertSiteMediaSchema = z.object({
  body: siteMediaBodySchema,
});

export const updateSiteMediaSchema = z.object({
  body: siteMediaBodySchema.partial(),
});

export type UpsertSiteMediaInput = z.infer<typeof upsertSiteMediaSchema>['body'];
export type UpdateSiteMediaInput = z.infer<typeof updateSiteMediaSchema>['body'];
