"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
const AppError_1 = require("../../shared/errors/AppError");
const jwt_utils_1 = require("../../shared/utils/jwt.utils");
const emailService_1 = require("../../services/emailService");
class AuthService {
    static async register(data) {
        const existingUser = await database_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new AppError_1.AppError('Email is already registered', 400);
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        const user = await database_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                phone: data.phone,
                role: client_1.Role.USER, // Default
            },
        });
        return this.generateAuthResponse(user);
    }
    static async login(data) {
        const user = await database_1.prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw new AppError_1.AppError('Invalid credentials', 401);
        }
        const isValidPassword = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isValidPassword) {
            throw new AppError_1.AppError('Invalid credentials', 401);
        }
        return this.generateAuthResponse(user);
    }
    static async refresh(token) {
        try {
            const payload = (0, jwt_utils_1.verifyRefreshToken)(token);
            const user = await database_1.prisma.user.findUnique({ where: { id: payload.id } });
            if (!user || user.refreshToken !== token) {
                throw new AppError_1.AppError('Invalid refresh token', 401);
            }
            return this.generateAuthResponse(user);
        }
        catch (error) {
            throw new AppError_1.AppError('Invalid or expired refresh token', 401);
        }
    }
    static async logout(userId) {
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });
    }
    static async getMe(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new AppError_1.AppError('User not found', 404);
        return user;
    }
    static async forgotPassword(email) {
        const user = await database_1.prisma.user.findUnique({ where: { email } });
        // Always return success to prevent email enumeration
        if (!user) {
            return;
        }
        // Generate reset token
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        // Store reset token in database (using refreshToken temporarily)
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: resetToken,
                updatedAt: new Date(),
            },
        });
        // Send reset email
        const resetLink = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${resetToken}`;
        await (0, emailService_1.sendPasswordReset)(email, resetLink);
    }
    static async resetPassword(token, newPassword) {
        const user = await database_1.prisma.user.findFirst({
            where: {
                refreshToken: token,
                updatedAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
                }
            },
        });
        if (!user) {
            throw new AppError_1.AppError('Invalid or expired reset token', 400);
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        // Update password and clear reset token
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                refreshToken: null,
                updatedAt: new Date(),
            },
        });
    }
    static async generateAuthResponse(user) {
        const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
        const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        return {
            accessToken,
            refreshToken,
            user: payload,
        };
    }
}
exports.AuthService = AuthService;
