// frontend/src/hooks/useFinanceData.ts
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../constants/appConfig';
import { FINANCE_METRICS, ACCOUNTS, ALLOC_ROUTES } from '../constants/mockData';

export function useFinanceData() {
  const [data, setData] = useState({
    metrics: FINANCE_METRICS,
    accounts: ACCOUNTS,
    routes: ALLOC_ROUTES,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/finance/overview`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData) {
          setData((prev) => ({
            ...prev,
            metrics: { ...prev.metrics, ...resData.metrics },
          }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Backend server unreachable, falling back to local mock data:', err);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}