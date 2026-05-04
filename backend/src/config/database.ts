import { PrismaClient } from '@prisma/client';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { env } from './env';

// Configure Neon to use WebSockets for better performance in serverless/low-latency environments
if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Create a connection pool to Neon
// Using 'any' for the connection string to avoid potential type mismatches in different environments
const pool = new Pool({ connectionString: env.DATABASE_URL as any });

// Initialize the Prisma adapter for Neon
// Casting pool to any to avoid TS7016/TS2345 in some ts-node versions
const adapter = new PrismaNeon(pool as any);

export const prisma = new PrismaClient({
  // @ts-ignore - The 'adapter' property is correctly handled at runtime but can cause issues with ts-node
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
