'use client';

import { useState } from 'react';
import { drugSearchApi } from '@/lib/api';
import { DrugSearchResult } from '@/lib/types/medication-prescription';

export function useDrugSearch() {
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDrugs = async (query: string, limit: number = 20, skip: number = 0) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await drugSearchApi.search(query, { limit, skip });
      setSearchResults(response.data.results || []);
    } catch (err) {
      console.error('Error searching drugs:', err);
      setError('Không thể tìm kiếm thuốc');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getDrugByNdc = async (ndc: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await drugSearchApi.search(ndc, { limit: 1 });
      return response.data;
    } catch (err) {
      console.error('Error getting drug by NDC:', err);
      setError('Không thể lấy thông tin thuốc');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setSearchResults([]);
    setError(null);
  };

  return {
    searchResults,
    loading,
    error,
    searchDrugs,
    getDrugByNdc,
    clearResults,
  };
}
