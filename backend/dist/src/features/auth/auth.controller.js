"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const response_1 = require("../../shared/utils/response");
class AuthController {
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
    static async register(req, res) {
        const result = await auth_service_1.AuthService.register(req.body);
        (0, response_1.sendResponse)(res, 201, result);
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
    static async login(req, res) {
        const result = await auth_service_1.AuthService.login(req.body);
        (0, response_1.sendResponse)(res, 200, result);
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
    static async refresh(req, res) {
        const result = await auth_service_1.AuthService.refresh(req.body.refreshToken);
        (0, response_1.sendResponse)(res, 200, result);
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
    static async logout(req, res) {
        await auth_service_1.AuthService.logout(req.user.id);
        (0, response_1.sendResponse)(res, 200, { message: 'Logged out successfully' });
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
    static async getMe(req, res) {
        const result = await auth_service_1.AuthService.getMe(req.user.id);
        (0, response_1.sendResponse)(res, 200, result);
    }
    /**
     * @swagger
     * /auth/forgot-password:
     *   post:
     *     summary: Request password reset
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *     responses:
     *       200:
     *         description: Password reset email sent
     */
    static async forgotPassword(req, res) {
        const { email } = req.body;
        await auth_service_1.AuthService.forgotPassword(email);
        (0, response_1.sendResponse)(res, 200, { message: 'Password reset instructions sent to your email' });
    }
    /**
     * @swagger
     * /auth/reset-password:
     *   post:
     *     summary: Reset password with token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - token
     *               - password
     *             properties:
     *               token:
     *                 type: string
     *               password:
     *                 type: string
     *                 minLength: 8
     *     responses:
     *       200:
     *         description: Password reset successfully
     */
    static async resetPassword(req, res) {
        const { token, password } = req.body;
        await auth_service_1.AuthService.resetPassword(token, password);
        (0, response_1.sendResponse)(res, 200, { message: 'Password reset successfully' });
    }
}
exports.AuthController = AuthController;
