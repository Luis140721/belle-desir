import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { sendResponse } from '../../shared/utils/response';

export class AdminController {
  
  /**
   * @swagger
   * /admin/stats:
   *   get:
   *     summary: Get dashboard stats
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Stats object
   */
  static async getStats(req: Request, res: Response) {
    const stats = await AdminService.getStats();
    sendResponse(res, 200, stats);
  }
}
