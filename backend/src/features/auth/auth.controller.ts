import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendResponse } from '../../shared/utils/response';

export class AuthController {
  
  /**
   * @swagger
   * components:
   *   schemas:
   *     RegisterInput:
   *       type: object
   *       required:
   *         - name
   *         - email
   *         - password
   *       properties:
   *         name:
   *           type: string
   *         email:
   *           type: string
   *         password:
   *           type: string
   *     LoginInput:
   *       type: object
   *       required:
   *         - email
   *         - password
   *       properties:
   *         email:
   *           type: string
   *         password:
   *           type: string
   *     RefreshInput:
   *       type: object
   *       required:
   *         - refreshToken
   *       properties:
   *         refreshToken:
   *           type: string
   */

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RegisterInput'
   *     responses:
   *       201:
   *         description: User registered successfully
   */
  static async register(req: Request, res: Response) {
    const result = await AuthService.register(req.body);
    sendResponse(res, 201, result);
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login a user
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginInput'
   *     responses:
   *       200:
   *         description: Logged in successfully
   */
  static async login(req: Request, res: Response) {
    const result = await AuthService.login(req.body);
    sendResponse(res, 200, result);
  }

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Refresh tokens
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RefreshInput'
   *     responses:
   *       200:
   *         description: Tokens refreshed
   */
  static async refresh(req: Request, res: Response) {
    const result = await AuthService.refresh(req.body.refreshToken);
    sendResponse(res, 200, result);
  }

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Logout a user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logged out successfully
   */
  static async logout(req: Request, res: Response) {
    await AuthService.logout(req.user!.id);
    sendResponse(res, 200, { message: 'Logged out successfully' });
  }

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current authenticated user
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   */
  static async getMe(req: Request, res: Response) {
    const result = await AuthService.getMe(req.user!.id);
    sendResponse(res, 200, result);
  }
}
