import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load initial .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().url(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS URLs
  FRONTEND_URL: z.string().url(),
  ADMIN_URL: z.string().url(),
  
  // Storage Provider
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('cloudinary'),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  
  // Bold Colombia Payments
  BOLD_API_KEY: z.string().min(1),
  BOLD_INTEGRITY_SECRET: z.string().min(1),
  
  // Resend Email Service
  RESEND_API_KEY: z.string().min(1).optional(),
  FROM_EMAIL: z.string().email().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
