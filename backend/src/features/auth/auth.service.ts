import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '../../config/database';
import { Role } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt.utils';
import { sendPasswordReset } from '../../services/emailService';
import { RegisterInput, LoginInput } from './auth.schemas';

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: Role.USER, // Default
      },
    });

    return this.generateAuthResponse(user);
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    return this.generateAuthResponse(user);
  }

  static async refresh(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.id } });

      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
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

    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  static async forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Always return success to prevent email enumeration
  if (!user) {
    return;
  }

  // Generate reset token
  const resetToken = randomBytes(32).toString('hex');

  // Store reset token in database (using refreshToken temporarily)
  await prisma.user.update({
    where: { id: user.id },
    data: { 
      refreshToken: resetToken,
      updatedAt: new Date(),
    },
  });

  // Send reset email
  const resetLink = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${resetToken}`;
  await sendPasswordReset(email, resetLink);
}

static async resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { 
      refreshToken: token,
      updatedAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
      }
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      refreshToken: null,
      updatedAt: new Date(),
    },
  });
}

  private static async generateAuthResponse(user: any) {
    const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.user.update({
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
