import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

console.info('[Env] Loading environment variables...');

// Production hosts inject environment variables from their dashboard.
// Locally, .env.local wins and .env stays as a legacy fallback. dotenv does
// not override variables already exported in the shell.
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),

  // Required in every environment because the API cannot run without Prisma.
  DATABASE_URL: z.string().url(),

  // Safe local defaults keep development friction low. Production still checks
  // that real secrets were explicitly provided below.
  JWT_SECRET: z.string().min(32).default('local_jwt_secret_do_not_use_in_prod_123'),
  JWT_ACCESS_SECRET: z.string().min(32).default('local_access_secret_do_not_use_in_prod'),
  JWT_REFRESH_SECRET: z.string().min(32).default('local_refresh_secret_do_not_use_in_prod'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_URL: z.string().url().default('http://localhost:5174'),

  // Feature integrations are optional at boot in local development. The feature
  // itself should fail clearly if it is used without credentials.
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('cloudinary'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),

  BOLD_API_KEY: z.string().min(1).optional(),
  BOLD_INTEGRITY_SECRET: z.string().min(1).optional(),
  BOLD_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  FROM_EMAIL: z.string().email().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
});

console.info('[Env] Validating environment variables...');
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('[Env] CRITICAL FAILURE: invalid environment variables');
  console.error('[Env] Problematic variables:');

  const formatted = _env.error.format();
  for (const [key, value] of Object.entries(formatted)) {
    if (key === '_errors') continue;
    const errors = (value as any)?._errors;
    if (errors && errors.length > 0) {
      console.error('  -> ' + key + ': ' + errors.join(', '));
    }
  }

  console.error('[Env] Review local .env.local/.env files or production dashboard variables.');
  process.exit(1);
}

if (_env.data.NODE_ENV === 'production') {
  const productionRequiredVars: (keyof z.infer<typeof envSchema>)[] = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL',
    'ADMIN_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'BOLD_API_KEY',
    'BOLD_INTEGRITY_SECRET',
  ];

  const missingProductionVars = productionRequiredVars.filter((key) => !process.env[key]);

  if (missingProductionVars.length > 0) {
    console.error('[Env] CRITICAL FAILURE: missing required production variables:');
    for (const key of missingProductionVars) {
      console.error('  -> ' + key);
    }
    process.exit(1);
  }
}

console.info('[Env] Environment variables are valid');
console.info('[Env] Mode: ' + _env.data.NODE_ENV + ' | Port: ' + _env.data.PORT);

export const env = _env.data;
