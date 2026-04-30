import { z } from 'zod';

export const createMultimediaSchema = z.object({
  title: z.string().optional(),
  alt: z.string().optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'BACKGROUND', 'SUPPORT']),
  url: z.string().url(),
  page: z.string(),
  section: z.string(),
  position: z.string().optional(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  overlayOpacity: z.number().min(0).max(1).default(0),
  alignment: z.string().optional(),
  size: z.string().optional(),
  desktopVisible: z.boolean().default(true),
  mobileVisible: z.boolean().default(true),
});

export const updateMultimediaSchema = createMultimediaSchema.partial();
