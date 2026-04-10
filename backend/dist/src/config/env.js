"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load initial .env file
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env'), override: true });
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3001'),
    DATABASE_URL: zod_1.z.string().url(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(1),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    WOMPI_PUBLIC_KEY: zod_1.z.string().min(1).optional(), // Not strictly required for the backend webhook but useful
    WOMPI_EVENTS_SECRET: zod_1.z.string().min(1).optional(), // Optional since we use Bold
    // Puede ser una URL o varias separadas por coma: "http://a.com,http://b.com"
    FRONTEND_URL: zod_1.z.string().min(1),
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:5173'),
    STORAGE_PROVIDER: zod_1.z.enum(['local', 'cloudinary']).default('local'),
    // Bold
    BOLD_API_KEY: zod_1.z.string().min(1),
    BOLD_INTEGRITY_SECRET: zod_1.z.string().min(1),
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Invalid environment variables:');
    console.error(_env.error.format());
    process.exit(1);
}
exports.env = _env.data;
