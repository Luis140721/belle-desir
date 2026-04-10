import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load initial .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  WOMPI_PUBLIC_KEY: z.string().min(1).optional(), // Not strictly required for the backend webhook but useful
  WOMPI_EVENTS_SECRET: z.string().min(1),
  // Puede ser una URL o varias separadas por coma: "http://a.com,http://b.com"
  FRONTEND_URL: z.string().min(1),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  
  // Bold
  BOLD_API_KEY: z.string().min(1),
  BOLD_INTEGRITY_SECRET: z.string().min(1),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
