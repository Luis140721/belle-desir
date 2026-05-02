import { Router, Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import multer from 'multer';
import { SiteMediaController } from './siteMedia.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { updateSiteMediaSchema, upsertSiteMediaSchema } from './siteMedia.schemas';
import { siteMediaUpload } from '../../config/multer';

export const siteMediaRoutes = Router();

siteMediaRoutes.get('/', asyncHandler(SiteMediaController.publicList));

siteMediaRoutes.get('/admin', authenticate(), authorize(Role.ADMIN), asyncHandler(SiteMediaController.adminList));
siteMediaRoutes.post('/admin/upload', authenticate(), authorize(Role.ADMIN), (req: Request, res: Response, next: NextFunction) => {
  siteMediaUpload.single('media')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
    }
    if (err) {
      return res.status(500).json({ success: false, message: 'Storage provider error: ' + err.message });
    }
    next();
  });
}, asyncHandler(SiteMediaController.upload));
siteMediaRoutes.post('/admin', authenticate(), authorize(Role.ADMIN), validate(upsertSiteMediaSchema), asyncHandler(SiteMediaController.create));
siteMediaRoutes.put('/admin/:id', authenticate(), authorize(Role.ADMIN), validate(updateSiteMediaSchema), asyncHandler(SiteMediaController.update));
siteMediaRoutes.delete('/admin/:id', authenticate(), authorize(Role.ADMIN), asyncHandler(SiteMediaController.delete));
