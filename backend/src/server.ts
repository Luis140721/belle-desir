// ============================================================
// SERVER.TS — Punto de entrada del servidor
// Conecta a la base de datos y levanta el servidor HTTP.
//
// PUNTOS DE FALLA POSIBLES:
// - DATABASE_URL incorrecta o DB no accesible → prisma.$connect falla
// - Puerto ya en uso → app.listen falla
// - Variables de entorno inválidas → env.ts lanza process.exit(1)
// ============================================================

import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

/**
 * startServer()
 * Inicializa la conexión a la base de datos y arranca el servidor Express.
 * Cada paso crítico está envuelto en try-catch con logs descriptivos.
 */
const startServer = async () => {
  try {
    // ── Paso 1: Conexión a la base de datos ──────────────────
    // Podría fallar si DATABASE_URL es incorrecta, la DB está caída,
    // o si hay restricciones de red/SSL en Neon.
    console.info('[Server] Paso 1/3: Conectando a la base de datos...');
    await prisma.$connect();
    console.info('[Server] ✅ Conexión a la base de datos establecida correctamente');

    // ── Paso 2: Verificar que Prisma puede ejecutar queries ──
    // Podría fallar si las migraciones no están aplicadas o el schema
    // no coincide con la base de datos real.
    console.info('[Server] Paso 2/3: Verificando acceso a tablas...');
    await prisma.$queryRawUnsafe('SELECT 1');
    console.info('[Server] ✅ Base de datos responde correctamente');

    // ── Paso 3: Iniciar el servidor HTTP ─────────────────────
    // Podría fallar si el puerto está ocupado.
    const port = env.PORT || '3001';
    console.info('[Server] Paso 3/3: Iniciando servidor HTTP en puerto ' + port + '...');

    app.listen(port, () => {
      console.info('[Server] ✅ Servidor corriendo en puerto ' + port + ' | Entorno: ' + env.NODE_ENV);
      console.info('[Server] ✅ Health check disponible en /api/health');
    });

  } catch (error: unknown) {
    // ── Diagnóstico del error ────────────────────────────────
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Detectar tipo de fallo para dar contexto útil
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED')) {
      console.error('[Server] ❌ FALLO CRÍTICO: No se pudo conectar a la base de datos.');
      console.error('[Server] Posibles causas:');
      console.error('  - DATABASE_URL es incorrecta o apunta a un servidor inalcanzable');
      console.error('  - La base de datos Neon está suspendida (free tier duerme tras inactividad)');
      console.error('  - Hay restricciones de red en el entorno de ejecución');
    } else if (errorMessage.includes('EADDRINUSE')) {
      console.error('[Server] ❌ FALLO CRÍTICO: El puerto ya está en uso.');
      console.error('[Server] Otro proceso ya está usando el puerto configurado.');
    } else if (errorMessage.includes('migration') || errorMessage.includes('P3')) {
      console.error('[Server] ❌ FALLO CRÍTICO: Problema con las migraciones de Prisma.');
      console.error('[Server] Ejecuta: npx prisma migrate deploy');
    } else {
      console.error('[Server] ❌ FALLO CRÍTICO al iniciar el servidor:', errorMessage);
    }

    // Log técnico completo para debugging
    console.error('[Server] Error técnico completo:', error);
    process.exit(1);
  }
};

startServer();
