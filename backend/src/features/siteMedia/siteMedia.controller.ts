import { Request, Response } from 'express';
import path from 'path';
import { SiteMediaService } from './siteMedia.service';
import { sendResponse } from '../../shared/utils/response';

export class SiteMediaController {
  static async publicList(_req: Request, res: Response) {
    const result = await SiteMediaService.publicList();
    sendResponse(res, 200, result);
  }

  static async adminList(_req: Request, res: Response) {
    const result = await SiteMediaService.adminList();
    sendResponse(res, 200, result);
  }

  static async create(req: Request, res: Response) {
    const result = await SiteMediaService.create(req.body);
    sendResponse(res, 201, result);
  }

  static async update(req: Request, res: Response) {
    const result = await SiteMediaService.update(req.params.id as string, req.body);
    sendResponse(res, 200, result);
  }

  static async delete(req: Request, res: Response) {
    const result = await SiteMediaService.delete(req.params.id as string);
    sendResponse(res, 200, result);
  }

  static async upload(req: Request, res: Response) {
    if (!req.file) {
      return sendResponse(res, 400, { message: 'No file provided' });
    }

    const uploadedPath = req.file.path || '';
    const publicUrl = uploadedPath.startsWith('http')
      ? uploadedPath
      : `${req.protocol}://${req.get('host')}/uploads/site-media/${path.basename(uploadedPath)}`;

    sendResponse(res, 200, {
      url: publicUrl,
      mimetype: req.file.mimetype,
      type: req.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    });
  }
}
