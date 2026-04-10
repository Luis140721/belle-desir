"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, statusCode, data, meta) => {
    res.status(statusCode).json({
        success: statusCode >= 200 && statusCode < 300,
        data,
        ...(meta && { meta })
    });
};
exports.sendResponse = sendResponse;
