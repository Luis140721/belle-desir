// ============================================================
// ENV.TS — Validación de Variables de Entorno
// Valida con Zod que todas las variables requeridas existan y
// tengan el formato correcto ANTES de que el servidor arranque.
//
// PUNTOS DE FALLA POSIBLES:
// - Variable faltante en el dashboard de Render
// - Formato incorrecto (URL sin protocolo, JWT_SECRET muy corto)
// - Archivo .env no encontrado en desarrollo local
// ============================================================

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// ── Paso 1: Cargar archivo .env (solo afecta en desarrollo) ──
// En producción (Render), las variables vienen del dashboard.
// Podría fallar si el .env no existe, pero eso es esperado en producción.
console.info('[Env] Cargando variables de entorno...');
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

// ── Paso 2: Definir schema de validación ─────────────────────
// Cada variable se valida con su tipo y restricciones.
// Las opcionales tienen .optional() — el backend arranca sin ellas.
const envSchema = z.object({
  // ── General ────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // ── Base de datos (Neon PostgreSQL) ────────────────────────
  // Sin esta variable el servidor NO puede arrancar.
  DATABASE_URL: z.string().url(),

  // ── JWT (Autenticación) ────────────────────────────────────
  // Mínimo 32 caracteres para seguridad. Si son más cortas,
  // los tokens generados serían vulnerables a fuerza bruta.
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ── CORS (Orígenes permitidos) ─────────────────────────────
  // Deben ser URLs completas con protocolo (https://...).
  // Sin trailing slash. Si no coinciden exactamente con el
  // dominio de Vercel, las peticiones del frontend/admin fallarán.
  FRONTEND_URL: z.string().url(),
  ADMIN_URL: z.string().url(),

  // ── Cloudinary (Almacenamiento de imágenes) ────────────────
  // Sin estas variables, la subida de imágenes desde el admin falla.
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('cloudinary'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // ── Bold Colombia (Procesador de pagos) ────────────────────
  // Sin estas variables, la generación de links de pago falla
  // pero la creación de órdenes sigue funcionando (sin checkout).
  BOLD_API_KEY: z.string().min(1),
  BOLD_INTEGRITY_SECRET: z.string().min(1),

  // ── Resend (Servicio de email) — OPCIONALES ────────────────
  // Sin estas el backend funciona, pero no envía emails de
  // confirmación de pedido ni de reseteo de contraseña.
  RESEND_API_KEY: z.string().min(1).optional(),
  FROM_EMAIL: z.string().email().optional(),
});

// ── Paso 3: Validar variables contra el schema ───────────────
// safeParse no lanza excepción — retorna success/error.
console.info('[Env] Validando variables de entorno...');
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // ── Error: Variables inválidas o faltantes ──────────────────
  // Mostramos EXACTAMENTE qué variables fallan para que el
  // desarrollador sepa qué configurar en Render.
  console.error('[Env] ❌ FALLO CRÍTICO: Variables de entorno inválidas');
  console.error('[Env] Las siguientes variables tienen problemas:');

  const formatted = _env.error.format();
  // Mostrar cada error de forma legible
  for (const [key, value] of Object.entries(formatted)) {
    if (key === '_errors') continue;
    const errors = (value as any)?._errors;
    if (errors && errors.length > 0) {
      console.error('  → ' + key + ': ' + errors.join(', '));
    }
  }

  console.error('[Env] Revisa el dashboard de Render → Environment → configura las variables faltantes.');
  process.exit(1);
}

console.info('[Env] ✅ Todas las variables de entorno son válidas');
console.info('[Env] Entorno: ' + _env.data.NODE_ENV + ' | Puerto: ' + _env.data.PORT);

export const env = _env.data;
