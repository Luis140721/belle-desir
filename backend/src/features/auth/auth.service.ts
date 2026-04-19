// ============================================================
// AUTH SERVICE — Lógica de autenticación
// Maneja registro, login, refresh tokens, logout y reset de contraseña.
//
// PUNTOS DE FALLA POSIBLES:
// - bcrypt.hash falla por memoria insuficiente (rounds muy altos)
// - Prisma falla por DB caída o restricciones de schema
// - JWT generation falla si los secrets son inválidos
// - Email service falla al enviar reset de contraseña
// ============================================================

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { prisma } from '../../config/database.js';
import { Role } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt.utils.js';
import { sendPasswordReset } from '../../services/emailService.js';
import { RegisterInput, LoginInput } from './auth.schemas.js';

export class AuthService {

  /**
   * register()
   * Crea un nuevo usuario con email y contraseña hasheada.
   *
   * @param data - { name, email, password, phone? }
   * @returns Tokens de acceso y datos del usuario
   * @throws AppError 400 si el email ya está registrado
   */
  static async register(data: RegisterInput) {
    console.info('[Auth] Registro: verificando email ' + data.email + '...');

    try {
      // Verificar si el email ya existe.
      // Podría fallar si la DB está caída.
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        console.warn('[Auth] Registro fallido: email ' + data.email + ' ya está registrado');
        throw new AppError('Email is already registered', 400);
      }

      // Hashear contraseña con 12 rounds de salt.
      // Podría fallar si hay problemas de memoria (muy raro).
      console.info('[Auth] Hasheando contraseña...');
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Crear usuario en la base de datos.
      // Podría fallar si hay un race condition (dos registros simultáneos).
      console.info('[Auth] Creando usuario en la base de datos...');
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          role: Role.USER,
        },
      });

      console.info('[Auth] ✅ Usuario registrado exitosamente: ' + user.email);
      return this.generateAuthResponse(user);

    } catch (error) {
      // Re-lanzar AppErrors (son errores de negocio esperados)
      if (error instanceof AppError) throw error;

      console.error('[Auth] ❌ Error inesperado durante registro de ' + data.email + ':', error);
      throw new AppError('Error al registrar usuario. Intenta de nuevo.', 500);
    }
  }

  /**
   * login()
   * Autentica un usuario por email y contraseña.
   *
   * @param data - { email, password }
   * @returns Tokens de acceso y datos del usuario
   * @throws AppError 401 si las credenciales son inválidas
   */
  static async login(data: LoginInput) {
    console.info('[Auth] Login: verificando credenciales para ' + data.email + '...');

    try {
      // Buscar usuario por email.
      // Podría fallar si la DB está caída.
      const user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user) {
        // No revelar si el email existe o no (seguridad)
        console.warn('[Auth] Login fallido: email ' + data.email + ' no encontrado');
        throw new AppError('Invalid credentials', 401);
      }

      // Comparar contraseña con el hash almacenado.
      // Podría fallar si el hash en la DB está corrupto.
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        console.warn('[Auth] Login fallido: contraseña incorrecta para ' + data.email);
        throw new AppError('Invalid credentials', 401);
      }

      console.info('[Auth] ✅ Login exitoso para ' + user.email + ' (rol: ' + user.role + ')');
      return this.generateAuthResponse(user);

    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error('[Auth] ❌ Error inesperado durante login de ' + data.email + ':', error);
      throw new AppError('Error al iniciar sesión. Intenta de nuevo.', 500);
    }
  }

  /**
   * refresh()
   * Genera nuevos tokens usando un refresh token válido.
   *
   * @param token - Refresh token actual
   * @returns Nuevos tokens de acceso
   * @throws AppError 401 si el token es inválido o expirado
   */
  static async refresh(token: string) {
    console.info('[Auth] Refresh: verificando token...');

    try {
      // Verificar y decodificar el refresh token.
      // Podría fallar si el token expiró o fue manipulado.
      const payload = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.id } });

      if (!user || user.refreshToken !== token) {
        console.warn('[Auth] Refresh fallido: token no coincide o usuario no existe');
        throw new AppError('Invalid refresh token', 401);
      }

      console.info('[Auth] ✅ Token refrescado para ' + user.email);
      return this.generateAuthResponse(user);

    } catch (error) {
      if (error instanceof AppError) throw error;
      console.warn('[Auth] Refresh fallido: token inválido o expirado');
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  /**
   * logout()
   * Invalida el refresh token del usuario.
   */
  static async logout(userId: string) {
    console.info('[Auth] Logout: invalidando token para usuario ' + userId);

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
      console.info('[Auth] ✅ Logout exitoso');
    } catch (error) {
      console.error('[Auth] ❌ Error al hacer logout para ' + userId + ':', error);
      // No lanzar error — logout siempre debe "funcionar" para el usuario
    }
  }

  /**
   * getMe()
   * Obtiene el perfil del usuario autenticado.
   */
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

    if (!user) {
      console.warn('[Auth] getMe: usuario ' + userId + ' no encontrado');
      throw new AppError('User not found', 404);
    }
    return user;
  }

  /**
   * forgotPassword()
   * Genera un token de reset y envía email con el enlace.
   * SIEMPRE retorna éxito para evitar enumeración de emails.
   */
  static async forgotPassword(email: string) {
    console.info('[Auth] Forgot password: procesando solicitud para ' + email);

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      // Siempre retornar éxito para prevenir enumeración de emails
      if (!user) {
        console.info('[Auth] Email no encontrado, pero respondiendo OK (prevención de enumeración)');
        return;
      }

      // Generar token de reset seguro
      const resetToken = randomBytes(32).toString('hex');

      // Almacenar token en la DB (usando campo refreshToken temporalmente).
      // Podría fallar si la DB está caída.
      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: resetToken,
          updatedAt: new Date(),
        },
      });

      // Enviar email con enlace de reset.
      // Podría fallar si RESEND_API_KEY no está configurada.
      const resetLink = process.env.FRONTEND_URL + '/restablecer-contrasena?token=' + resetToken;
      console.info('[Auth] Enviando email de reset...');
      await sendPasswordReset(email, resetLink);
      console.info('[Auth] ✅ Email de reset enviado a ' + email);

    } catch (error) {
      // No lanzar error al usuario — siempre respondemos OK
      console.error('[Auth] ❌ Error al procesar forgot-password para ' + email + ':', error);
    }
  }

  /**
   * resetPassword()
   * Cambia la contraseña usando un token de reset válido.
   *
   * @param token - Token recibido por email
   * @param newPassword - Nueva contraseña
   * @throws AppError 400 si el token es inválido o expiró (1 hora)
   */
  static async resetPassword(token: string, newPassword: string) {
    console.info('[Auth] Reset password: verificando token...');

    try {
      // Buscar usuario con ese token y que no tenga más de 1 hora
      const user = await prisma.user.findFirst({
        where: {
          refreshToken: token,
          updatedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          }
        },
      });

      if (!user) {
        console.warn('[Auth] Reset password fallido: token inválido o expirado');
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Hashear nueva contraseña
      console.info('[Auth] Hasheando nueva contraseña...');
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Actualizar contraseña y limpiar token de reset
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          refreshToken: null,
          updatedAt: new Date(),
        },
      });

      console.info('[Auth] ✅ Contraseña actualizada exitosamente para ' + user.email);

    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('[Auth] ❌ Error al resetear contraseña:', error);
      throw new AppError('Error al restablecer la contraseña. Intenta de nuevo.', 500);
    }
  }

  /**
   * generateAuthResponse() [privado]
   * Genera tokens JWT y actualiza el refreshToken en la DB.
   *
   * @param user - Usuario de Prisma
   * @returns { accessToken, refreshToken, user }
   */
  private static async generateAuthResponse(user: any) {
    try {
      const payload = { id: user.id, email: user.email, name: user.name, role: user.role };

      // Generar tokens JWT.
      // Podría fallar si JWT_ACCESS_SECRET o JWT_REFRESH_SECRET son inválidos.
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Guardar el refreshToken en la DB para validación posterior
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return {
        accessToken,
        refreshToken,
        user: payload,
      };

    } catch (error) {
      console.error('[Auth] ❌ Error al generar tokens de autenticación para ' + user.email + ':', error);
      throw new AppError('Error al generar sesión. Intenta de nuevo.', 500);
    }
  }
}
