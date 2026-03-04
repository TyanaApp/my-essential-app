import { useEffect } from 'react';

export const usePageTitle = (page: string) => {
  useEffect(() => {
    document.title = `TYANA — ${page}`;
    return () => { document.title = 'TYANA — Kitchen Assistant'; };
  }, [page]);
};
