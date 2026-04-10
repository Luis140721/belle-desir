"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagingData = exports.getPagination = void 0;
const getPagination = (page, limit) => {
    const take = limit || 10;
    const skip = (page - 1) * take || 0;
    return { take, skip };
};
exports.getPagination = getPagination;
const getPagingData = (total, page, limit) => {
    const currentPage = page ? +page : 1;
    const totalPages = Math.ceil(total / limit);
    return { total, page: currentPage, limit, totalPages };
};
exports.getPagingData = getPagingData;
