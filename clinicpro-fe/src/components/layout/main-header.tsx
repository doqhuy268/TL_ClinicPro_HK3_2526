'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

export function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'DOCTOR': return 'Bác sĩ';
      case 'RECEPTIONIST': return 'Lễ tân';
      case 'CASHIER': return 'Thu ngân';
      case 'PATIENT': return 'Bệnh nhân';
      default: return 'Người dùng';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'DOCTOR': return 'default';
      case 'RECEPTIONIST': return 'secondary';
      case 'CASHIER': return 'secondary';
      case 'PATIENT': return 'outline';
      default: return 'outline';
    }
  };

  const handleLogout = async () => {
    await logout();
    // Redirect to homepage after logout
    window.location.href = '/';
  };

  const handleProfile = () => {
    // For main-layout users (mainly patients), they should stay in main-layout
    window.location.href = '/profile';
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Logo */}
          <div className="flex items-center h-full">
            <Link href="/" className="flex items-center space-x-2 h-full">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
               <Image src="/logos/LogoClinicPro-v1-noneBG.png" alt="ClinicPro Logo" width={40} height={40} className='rounded-lg'/>
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">ClinicPro</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className="px-4 py-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
            >
              Trang chủ
            </Link>
            <Link 
              href="/posts" 
              className="px-4 py-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
            >
              Tin tức
            </Link>
            <Link 
              href="specialties" 
              className="px-4 py-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
            >
              Chuyên khoa
            </Link>
            <Link 
              href="/doctors" 
              className="px-4 py-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
            >
              Bác sĩ
            </Link>
            <Link 
              href="/contact" 
              className="px-4 py-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
            >
              Liên hệ
            </Link>
            <Link 
              href="/drug-search" 
              className="px-4 py-2 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
            >
              Tra cứu thuốc
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Patient specific actions */}
                {user.role === 'PATIENT' && (
                  <div className="hidden sm:flex items-center space-x-2">
                    <Button asChild size="sm" className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200">
                      <Link href="/booking">
                        <Calendar className="h-4 w-4 mr-2" />
                        Đặt lịch
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="border-gray-300  transition-all duration-200">
                      <Link href="/my-appointments">
                        <Calendar className="h-4 w-4 mr-2" />
                        Lịch hẹn
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="border-gray-300  transition-all duration-200">
                      <Link href="/my-patient-profiles">
                        <FileText className="h-4 w-4 mr-2" />
                        Hồ sơ
                      </Link>
                    </Button>
                  </div>
                )}

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/10 transition-all duration-200">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                        <AvatarImage src={user.avatar || ''} alt={user.name} />
                        <AvatarFallback className="bg-linear-to-br from-primary to-primary/80 text-white text-sm font-semibold">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 p-2" align="end" forceMount>
                    <div className="flex items-center justify-start gap-3 p-3 bg-linear-to-r from-primary/5 to-primary/10 rounded-lg mb-2">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || ''} alt={user.name} />
                        <AvatarFallback className="bg-linear-to-br from-primary to-primary/80 text-white">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="w-[200px] truncate text-sm text-gray-600">
                          {user.email}
                        </p>
                        <Badge 
                          variant={getRoleBadgeVariant(user.role)} 
                          className="w-fit text-xs mt-1"
                        >
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfile} className="p-3 hover:bg-primary/5 rounded-lg transition-colors duration-200">
                      <User className="mr-3 h-4 w-4 text-gray-600" />
                      <span className="font-medium">Hồ sơ cá nhân</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 hover:bg-primary/5 rounded-lg transition-colors duration-200">
                      <Settings className="mr-3 h-4 w-4 text-gray-600" />
                      <span className="font-medium">Cài đặt</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="p-3 hover:text-red-600 text-red-600 rounded-lg transition-colors duration-200">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="font-medium">Đăng xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button asChild variant="ghost" className="text-gray-600 border border-gray-300 hover:text-primary hover:bg-primary/5 hover:border-primary transition-all duration-200">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200">
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-gray-700" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50">
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link
                href="/"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link
                href="/specialties"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Dịch vụ
              </Link>
              <Link
                href="/doctors"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Bác sĩ
              </Link>
              <Link
                href="/contact"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Liên hệ
              </Link>
              
              {/* Patient specific mobile actions */}
              {user?.role === 'PATIENT' && (
                <>
                  <div className="border-t border-gray-200 my-4"></div>
                  <Link
                    href="/booking"
                    className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4 inline mr-3" />
                    Đặt lịch
                  </Link>
                  <Link
                    href="/my-appointments"
                    className="block px-4 py-3   rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4 inline mr-3" />
                    Lịch hẹn
                  </Link>
                  <Link
                    href="/my-patient-profiles"
                    className="block px-4 py-3  rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4 inline mr-3" />
                    Hồ sơ
                  </Link>
                  <Link
                    href="/drug-search"
                    className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4 inline mr-3" />
                    Tìm thuốc
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

