"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const response_1 = require("../../shared/utils/response");
class AdminController {
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
    static async getStats(req, res) {
        const stats = await admin_service_1.AdminService.getStats();
        (0, response_1.sendResponse)(res, 200, stats);
    }
}
exports.AdminController = AdminController;
