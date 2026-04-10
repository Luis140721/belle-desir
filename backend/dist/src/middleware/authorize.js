"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
const AppError_1 = require("../shared/errors/AppError");
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError_1.AppError('Not authenticated', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError_1.AppError('Not authorized', 403));
        }
        next();
    };
};
exports.authorize = authorize;
