"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_utils_1 = require("../shared/utils/jwt.utils");
const AppError_1 = require("../shared/errors/AppError");
/**
 * Middleware de autenticación flexible.
 *
 * Uso obligatorio (por defecto):  authenticate()
 * Uso opcional (guest allowed):   authenticate({ required: false })
 */
const authenticate = (options = { required: true }) => (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.required === false) {
            // Sin token y no requerido → continúa sin req.user
            return next();
        }
        return next(new AppError_1.AppError('No token provided or invalid format', 401));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch {
        if (options.required === false) {
            // Token inválido y no requerido → continúa sin req.user
            return next();
        }
        return next(new AppError_1.AppError('Invalid or expired token', 401));
    }
};
exports.authenticate = authenticate;
