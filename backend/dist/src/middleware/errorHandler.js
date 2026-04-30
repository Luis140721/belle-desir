"use strict";
// ============================================================
// ERROR HANDLER — Middleware global de manejo de errores
// Captura TODOS los errores que ocurren en cualquier ruta.
// Clasifica el error y devuelve una respuesta JSON estructurada.
//
// TIPOS DE ERROR MANEJADOS:
// - AppError: Errores de negocio (usuario no encontrado, validación)
// - ZodError: Datos de entrada inválidos (schema validation)
// - PrismaClientKnownRequestError: Errores de base de datos
// - Error genérico: Fallos inesperados (bugs, crashes)
//
// REGLA: Nunca exponer stack traces en producción.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const AppError_js_1 = require("../shared/errors/AppError.js");
const env_js_1 = require("../config/env.js");
/**
 * errorHandler
 * Middleware Express de 4 parámetros (err, req, res, next).
 * Express lo reconoce automáticamente como error handler.
 *
 * @param err  - El error capturado
 * @param req  - Request original
 * @param res  - Response para enviar al cliente
 * @param next - NextFunction (requerido por Express aunque no se use)
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = undefined;
    // ── Caso 1: Error de negocio (AppError) ────────────────────
    // Errores controlados: "Usuario no encontrado", "Email ya registrado", etc.
    // Estos son esperados y tienen código HTTP específico.
    if (err instanceof AppError_js_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        console.warn('[ErrorHandler] Error de negocio (' + statusCode + '): ' + message + ' | Ruta: ' + req.method + ' ' + req.path);
    }
    // ── Caso 2: Error de validación Zod ────────────────────────
    // Datos de entrada no cumplen el schema (ej: email inválido).
    // Siempre devuelve 400 con detalles de qué campos fallaron.
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        errors = err.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
        console.warn('[ErrorHandler] Validación fallida en ' + req.method + ' ' + req.path + ': ' + errors.map((e) => e.field + '=' + e.message).join(', '));
    }
    // ── Caso 3: Error de Prisma (base de datos) ────────────────
    // Errores conocidos de la DB: registros duplicados, no encontrados.
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            // Unique constraint violation — ej: email duplicado al registrarse
            statusCode = 409;
            message = 'A record with that unique field already exists.';
            console.warn('[ErrorHandler] Registro duplicado (P2002) en ' + req.method + ' ' + req.path);
        }
        else if (err.code === 'P2025') {
            // Record not found — ej: intentar actualizar una orden que no existe
            statusCode = 404;
            message = 'Record not found.';
            console.warn('[ErrorHandler] Registro no encontrado (P2025) en ' + req.method + ' ' + req.path);
        }
        else {
            // Otros errores de Prisma no mapeados
            console.error('[ErrorHandler] Error de Prisma no mapeado (' + err.code + ') en ' + req.method + ' ' + req.path + ':', err.message);
        }
    }
    // ── Caso 4: Error inesperado ───────────────────────────────
    // Bugs, crashes, errores de red, etc. Log completo para debugging.
    else {
        console.error('[ErrorHandler] ❌ Error inesperado (500) en ' + req.method + ' ' + req.path);
        console.error('[ErrorHandler] Tipo: ' + err.constructor.name);
        console.error('[ErrorHandler] Mensaje: ' + err.message);
    }
    // ── Log técnico para errores 500 (bugs reales) ─────────────
    // Solo loguear el stack completo para errores que son bugs.
    // Los AppError y ZodError son "esperados" y no necesitan stack.
    if (statusCode === 500) {
        console.error('[ErrorHandler] 🔥 STACK COMPLETO:', err);
    }
    // ── Respuesta al cliente ───────────────────────────────────
    // En producción NUNCA se envía el stack trace.
    res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
        ...(env_js_1.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
