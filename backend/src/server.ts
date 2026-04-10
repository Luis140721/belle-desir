import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

const startServer = async () => {
  try {
    // Verificar conexión a DB
    await prisma.$connect();
    console.log('✅ Connected to the database');

    const port = env.PORT || 3001;
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();
