import { Router } from 'express';
import * as MultimediaController from './multimedia.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

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
