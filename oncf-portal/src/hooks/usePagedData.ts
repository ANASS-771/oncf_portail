import { useState, useCallback } from 'react';
import type { DependencyList } from 'react';
import type { PagedResult } from '../types';

export function usePagedData<T>(
  fetcher: () => Promise<PagedResult<T>>,
  deps: DependencyList,
) {
  const [data, setData]       = useState<PagedResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetcher()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, load };
}
