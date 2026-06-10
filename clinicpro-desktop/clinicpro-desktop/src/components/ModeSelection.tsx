// Mode Selection Component — Màn hình chọn chế độ hoạt động của Kiosk

import React from 'react';
import { AppMode } from '../types';

interface ModeSelectionProps {
  onSelectMode: (mode: AppMode) => void;
}

const modes = [
  {
    id: 'kiosk' as AppMode,
    title: 'Kiosk Bốc Số',
    subtitle: 'Bệnh nhân tự thao tác để lấy số',
    icon: '🎫',
    gradient: 'from-teal-600 to-emerald-600',
    shadowColor: 'shadow-teal-500/20',
    features: [
      'Nhập tên, tuổi, giới tính',
      'AI tư vấn chuyên khoa phù hợp',
      'Hỗ trợ quét QR hồ sơ & lịch hẹn',
      'In phiếu khám tự động',
    ],
  },
  {
    id: 'counter' as AppMode,
    title: 'Quầy Tiếp Nhận',
    subtitle: 'Quản lý hàng đợi bệnh nhân',
    icon: '🏥',
    gradient: 'from-sky-600 to-blue-600',
    shadowColor: 'shadow-sky-500/20',
    features: [
      'Gọi bệnh nhân tiếp theo',
      'Bỏ qua / hoãn bệnh nhân',
      'Xem hàng đợi real-time',
      'Tạo phiếu chỉ định',
    ],
  },
  {
    id: 'clinic' as AppMode,
    title: 'Phòng Khám',
    subtitle: 'Quản lý bệnh nhân trong phòng',
    icon: '🩺',
    gradient: 'from-violet-600 to-purple-600',
    shadowColor: 'shadow-violet-500/20',
    features: [
      'Xem danh sách bệnh nhân',
      'Cập nhật trạng thái khám',
      'Hoàn thành khám bệnh',
      'Quản lý lịch trình',
    ],
  },
  {
    id: 'start-services' as AppMode,
    title: 'Xác nhận Dịch vụ',
    subtitle: 'Quét mã phiếu & bắt đầu dịch vụ',
    icon: '📋',
    gradient: 'from-amber-600 to-orange-600',
    shadowColor: 'shadow-amber-500/20',
    features: [
      'Quét mã PR-/APT- phiếu chỉ định',
      'Xem số dịch vụ đang chờ',
      'Nhấn xác nhận để bắt đầu',
    ],
  },
];

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 mb-5 shadow-lg shadow-teal-600/20">
            <span className="text-3xl">⚕️</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            ClinicPro Healthcare
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Chọn chế độ hoạt động cho thiết bị
          </p>
        </div>

        {/* Mode Grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {modes.map((mode) => (
            <div
              key={mode.id}
              className={`group cursor-pointer bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-xl ${mode.shadowColor} transition-all duration-300 hover:-translate-y-1`}
              onClick={() => onSelectMode(mode.id)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center text-2xl shrink-0 shadow-md ${mode.shadowColor}`}>
                  {mode.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">
                    {mode.title}
                  </h2>
                  <p className="text-sm text-slate-500 mb-4">
                    {mode.subtitle}
                  </p>
                  <ul className="space-y-1.5">
                    {mode.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow */}
                <div className="text-slate-300 group-hover:text-teal-500 transition-colors mt-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ClinicPro v2.0 · Hệ thống đang hoạt động
        </div>
      </div>
    </div>
  );
};

export default ModeSelection;

