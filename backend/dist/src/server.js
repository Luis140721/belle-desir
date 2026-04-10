"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const startServer = async () => {
    try {
        // Verificar conexión a DB
        await database_1.prisma.$connect();
        console.log('✅ Connected to the database');
        const port = env_1.env.PORT || 3001;
        app_1.default.listen(port, () => {
            console.log(`🚀 Server is running on port ${port} in ${env_1.env.NODE_ENV} mode`);
        });
    }
    catch (error) {
        console.error('❌ Error starting server:', error);
        process.exit(1);
    }
};
startServer();
