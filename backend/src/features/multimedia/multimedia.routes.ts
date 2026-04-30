import { Router } from 'express';
import * as MultimediaController from './multimedia.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const multimediaRoutes = Router();

// Public
multimediaRoutes.get('/page/:page/section/:section', asyncHandler(MultimediaController.getMultimediaByPageAndSection));

// Admin only
multimediaRoutes.use(authenticate(), authorize('ADMIN'));
multimediaRoutes.get('/', asyncHandler(MultimediaController.getAllMultimedia));
multimediaRoutes.get('/:id', asyncHandler(MultimediaController.getMultimediaById));
multimediaRoutes.post('/', asyncHandler(MultimediaController.createMultimedia));
multimediaRoutes.put('/:id', asyncHandler(MultimediaController.updateMultimedia));
multimediaRoutes.delete('/:id', asyncHandler(MultimediaController.deleteMultimedia));
