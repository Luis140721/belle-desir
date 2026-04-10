export const getPagination = (page: number, limit: number) => {
  const take = limit || 10;
  const skip = (page - 1) * take || 0;
  return { take, skip };
};

export const getPagingData = (total: number, page: number, limit: number) => {
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(total / limit);

  return { total, page: currentPage, limit, totalPages };
};
