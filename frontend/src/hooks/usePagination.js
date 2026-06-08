import { useEffect, useMemo, useState } from 'react';

const usePagination = (items, initialSize = 10) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialSize);

  const totalPages = Math.max(1, Math.ceil((items?.length || 0) / pageSize));

  const paginated = useMemo(() => {
    if (!items) return [];
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const setPageSize = (size) => {
    setPageSizeState(size);
    setPage(1);
  };

  return { page, setPage, pageSize, setPageSize, totalPages, paginated };
};

export default usePagination;
