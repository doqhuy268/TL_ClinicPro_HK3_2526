// Counter Selection Component

import React, { useState, useEffect } from 'react';
import { Counter } from '../types';
import { apiService } from '../services/api';

interface CounterSelectionProps {
  onSelectCounter: (counter: Counter) => void;
  onBack: () => void;
}

const CounterSelection: React.FC<CounterSelectionProps> = ({ onSelectCounter, onBack }) => {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCounters();
  }, []);

  const loadCounters = async () => {
    try {
      setLoading(true);
      setError(null);
      const counterList = await apiService.getCounters();
      setCounters(counterList ?? []);
    } catch (err) {
      console.error('Failed to load counters:', err);
      setError('Không thể tải danh sách quầy. Vui lòng kiểm tra kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadCounters();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Đang tải danh sách quầy...
          </h2>
          <p className="text-gray-600">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Lỗi kết nối
          </h2>
          <p className="text-gray-600">
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetry}
              className="w-full bg-gray-900 text-white px-6 py-3 font-bold rounded-lg hover:bg-gray-800 transition-all shadow-lg"
            >
              Thử lại
            </button>
            <button
              onClick={onBack}
              className="w-full border-2 border-gray-300 px-6 py-3 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Chọn Quầy Tiếp Nhận
              </h1>
              <p className="text-base text-gray-600">
                Chọn quầy để bắt đầu quản lý hàng đợi
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-5 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
              ← Quay lại
            </button>
          </div>
        </div>

        {/* Counters Grid */}
        {counters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Không có quầy nào
            </h2>
            <p className="text-gray-600">
              Hiện tại không có quầy tiếp nhận nào được cấu hình
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counters.map((counter) => (
              <div
                key={counter.counterId}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 cursor-pointer hover:border-gray-900 hover:shadow-lg transition-all group"
                onClick={() => onSelectCounter(counter)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg text-white text-2xl font-bold group-hover:scale-110 transition-transform">
                    {counter.counterCode}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-900 transition-colors">
                  {counter.counterName}
                </h3>
                
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">{counter.location}</span>
                </div>
                
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Click để chọn →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CounterSelection;
