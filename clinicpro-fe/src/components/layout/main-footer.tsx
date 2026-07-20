import Link from 'next/link';
import {  Phone, Mail, MapPin, Facebook, Youtube, Instagram } from 'lucide-react';
import Image from 'next/image';

export function MainFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Image src="/logos/LogoClinicPro-v1.png" alt="ClinicPro Logo" width={32} height={32} className='rounded-lg'/>
              </div>
              <span className="text-xl font-bold">ClinicPro</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Hệ thống quản lý phòng khám toàn diện, mang đến dịch vụ chăm sóc sức khỏe tốt nhất cho cộng đồng.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                  Dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/doctors" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                  Bác sĩ
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                  Đặt lịch
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dịch vụ</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-gray-300 text-sm">Khám tổng quát</span>
              </li>
              <li>
                <span className="text-gray-300 text-sm">Khám chuyên khoa</span>
              </li>
              <li>
                <span className="text-gray-300 text-sm">Xét nghiệm</span>
              </li>
              <li>
                <span className="text-gray-300 text-sm">Chẩn đoán hình ảnh</span>
              </li>
              <li>
                <span className="text-gray-300 text-sm">Phẫu thuật</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Thông tin liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-gray-300 text-sm">(024) 1234 5678</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-gray-300 text-sm">contact@clinicpro.vn</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-gray-300 text-sm">admin@clinicpro.vn</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-gray-300 text-sm">
                  Đường Nguyễn Văn Bảo, Quận Gò Vấp<br />
                  TP.HCM, Việt Nam
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2026 ClinicPro. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Chính sách bảo mật
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

