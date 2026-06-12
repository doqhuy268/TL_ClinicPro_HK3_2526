"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Phone, Mail, ArrowRight, Loader2, ChevronLeft, Lock, Zap, Heart, Shield, Activity } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/hooks/useAuth"
import { getRedirectPathByRole } from "@/lib/utils/redirect"

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("") // phone or email
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [devSetupLoading, setDevSetupLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEmailMode, setIsEmailMode] = useState(false)
  const router = useRouter()

  const { login } = useAuth();

  const handleDevQuickSetup = async () => {
    setDevSetupLoading(true);
    try {
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api`).replace(/\/$/, "");
      const res = await fetch(`${apiBaseUrl}/public/dev/quick-setup`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert("🚀 " + data.message + "\n\nBác sĩ: " + data.data.doctorEmail + "\nKTV: " + data.data.technicianEmail);
      } else {
        alert("❌ Lỗi setup: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Không thể kết nối đến server để Setup Test!");
    } finally {
      setDevSetupLoading(false);
    }
  }

  // Load error message from sessionStorage on component mount
  useEffect(() => {
    const savedError = sessionStorage.getItem('login_error');
    if (savedError) {
      setError(savedError);
      sessionStorage.removeItem('login_error'); // Clear after showing
    }
  }, []);

  // Global error handler để bắt mọi lỗi có thể gây reload
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // Lưu thông báo lỗi generic
      sessionStorage.setItem('login_error', 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      sessionStorage.setItem('login_error', 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Ngăn chặn mọi hành động mặc định
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    
    setLoading(true)
    setError("")

    try {
      console.log('Calling login function...')
      const ok = await login({ identifier, password });
      console.log('Login result:', ok)
      
      if (ok) {
        // Get user data to determine redirect path
        const userStr = localStorage.getItem('auth_user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const redirectPath = getRedirectPathByRole(user.role);
            console.log('Redirecting to:', redirectPath)
            router.push(redirectPath);
          } catch (error) {
            console.error('Error parsing user data:', error);
            router.push('/');
          }
        } else {
          router.push('/');
        }
      } else {
        // Login failed but no exception thrown
        const errorMessage = "Thông tin đăng nhập không chính xác";
        setError(errorMessage);
        // Lưu vào sessionStorage để hiển thị sau reload
        sessionStorage.setItem('login_error', errorMessage);
      }
    } catch (err: unknown) {
      console.error('Login error:', err)
      
      // Xử lý thông báo lỗi cụ thể từ API
      let errorMessage = "Thông tin đăng nhập không chính xác";
      
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = err as { response: { data: { message: string } } };
        const apiMessage = errorResponse.response.data.message;
        console.log('API error message:', apiMessage)
        
        if (apiMessage.toLowerCase().includes('invalid credentials') || 
            apiMessage.toLowerCase().includes('invalid') ||
            apiMessage.toLowerCase().includes('credentials')) {
          errorMessage = "Số điện thoại/email hoặc mật khẩu không chính xác";
        } else if (apiMessage.toLowerCase().includes('user not found')) {
          errorMessage = "Không tìm thấy tài khoản với thông tin này";
        } else if (apiMessage.toLowerCase().includes('password')) {
          errorMessage = "Mật khẩu không chính xác";
        } else {
          errorMessage = apiMessage;
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      
      console.log('Setting error message:', errorMessage)
      setError(errorMessage);
      // Lưu vào sessionStorage để hiển thị sau reload
      sessionStorage.setItem('login_error', errorMessage);
      
      // Force update UI trước khi có thể bị reload
      setTimeout(() => {
        setError(errorMessage);
      }, 100);
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setGoogleLoading(true)
    setError("")

    try {
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || `${window.location.origin}/api`).replace(/\/$/, "")
      const redirectUri = encodeURIComponent(`${window.location.origin}/login`)
      const googleAuthUrl = `${apiBaseUrl}/auth/google?redirect_uri=${redirectUri}`
      window.location.href = googleAuthUrl
    } catch (err) {
      console.error("Không thể khởi tạo đăng nhập Google:", err)
      setGoogleLoading(false)
      setError("Không thể khởi tạo đăng nhập Google")
    }
  }

  const toggleMode = () => {
    setIsEmailMode(!isEmailMode)
    setIdentifier("")
    setError("")
  }

  const handleBack = () => {
    router.push("/")
  }

  const handleForgotPassword = () => {
    // Navigate to forgot password page
    router.push("/forgot-password")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl" />
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Image
                src="/logos/LogoClinicPro-v1-noneBG.png"
                alt="ClinicPro Logo"
                width={32}
                height={32}
                className="brightness-0 invert"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ClinicPro</h2>
              <p className="text-xs text-white/60 font-medium uppercase tracking-widest">Healthcare System</p>
            </div>
          </div>

          {/* Main Message */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
                Quản lý<br />
                phòng khám<br />
                <span className="text-emerald-200">thông minh.</span>
              </h1>
              <p className="text-lg text-white/70 mt-6 max-w-md leading-relaxed">
                Hệ thống quản lý khám bệnh tích hợp Kiosk tự phục vụ 
                với Chatbot AI y tế tiên tiến.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="flex gap-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-rose-300" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">AI Chatbot</p>
                  <p className="text-white/50 text-xs">Tư vấn sức khỏe 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Real-time</p>
                  <p className="text-white/50 text-xs">Đồng bộ tức thì</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <Shield className="h-4 w-4" />
            <span>Bảo mật dữ liệu y khoa theo chuẩn quốc tế</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 lg:left-auto lg:right-6 inline-flex items-center text-slate-500 hover:text-slate-800 font-medium transition-all bg-white rounded-xl px-4 py-2 shadow-sm hover:shadow-md border border-slate-200/60"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Trang chủ</span>
        </button>

        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-4 shadow-lg shadow-teal-500/20">
              <Image
                src="/logos/LogoClinicPro-v1-noneBG.png"
                alt="ClinicPro Logo"
                width={36}
                height={36}
                className="brightness-0 invert"
              />
            </div>
            <h1 className="text-xl font-bold text-slate-800">ClinicPro Healthcare</h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Chào mừng trở lại</h1>
            <p className="text-slate-500 mt-2">Đăng nhập để tiếp tục quản lý hệ thống</p>
          </div>

          {/* Form */}
          <div className="space-y-6" onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit();
            }
          }}>
            {/* Identifier Input */}
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-semibold text-slate-700">
                {isEmailMode ? "Email" : "Số điện thoại"}
              </Label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none">
                  {isEmailMode ? (
                    <Mail className="text-slate-400 group-focus-within:text-teal-600 w-4 h-4 transition-colors" />
                  ) : (
                    <Phone className="text-slate-400 group-focus-within:text-teal-600 w-4 h-4 transition-colors" />
                  )}
                </div>
                <Input
                  id="identifier"
                  placeholder={isEmailMode ? "name@example.com" : "0912 345 678"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit();
                    }
                  }}
                  type={isEmailMode ? "email" : "tel"}
                  className="pl-11 h-12 bg-white border-slate-200 rounded-xl focus:border-teal-500 focus:ring-teal-500/20 transition-all text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Mật khẩu
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-teal-600 hover:text-teal-700 text-xs font-semibold hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none">
                  <Lock className="text-slate-400 group-focus-within:text-teal-600 w-4 h-4 transition-colors" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSubmit();
                    }
                  }}
                  className="pl-11 h-12 bg-white border-slate-200 rounded-xl focus:border-teal-500 focus:ring-teal-500/20 transition-all text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Toggle Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-teal-600 hover:text-teal-700 text-sm font-semibold hover:underline transition-colors"
              >
                {isEmailMode ? "Đăng nhập bằng số điện thoại" : "Đăng nhập bằng email"}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 animate-in slide-in-from-top-2">
                <div className="flex items-start space-x-3">
                  <div className="shrink-0">
                    <svg className="h-5 w-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-rose-800 text-sm font-semibold">{error}</p>
                    <p className="text-rose-600 text-xs mt-1">Vui lòng kiểm tra lại thông tin đăng nhập</p>
                  </div>
                  <button
                    onClick={() => setError("")}
                    className="shrink-0 text-rose-400 hover:text-rose-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40"
              disabled={loading || !identifier || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-50 text-slate-400 font-medium">hoặc</span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full h-12 border-slate-200 hover:border-slate-300 hover:bg-white bg-white transition-all duration-200 transform hover:scale-[1.01] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Đang đăng nhập Google...
                </>
              ) : (
                <>
                  <Image src="/socials/google.svg" alt="Google" width={20} height={20} className="mr-3" />
                  <span className="font-medium text-slate-700">Đăng nhập với Google</span>
                </>
              )}
            </Button>

            {/* Register Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-slate-500">
                Chưa có tài khoản?{" "}
                <a
                  href="/register"
                  className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors"
                >
                  Đăng ký ngay
                </a>
              </p>
            </div>
          </div>

          {/* Terms */}
          <div className="text-center mt-8">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bằng cách đăng nhập, bạn đồng ý với{" "}
              <a href="/terms" className="text-teal-600 hover:underline">
                Điều khoản dịch vụ
              </a>{" "}
              và{" "}
              <a href="/privacy" className="text-teal-600 hover:underline">
                Chính sách bảo mật
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Easter Egg: Dev Test Fast-Track */}
      <button
        onClick={handleDevQuickSetup}
        disabled={devSetupLoading}
        title="Quick Setup Test Environment (Night-shift bypass)"
        className="fixed bottom-6 right-6 inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 transition-all z-50 disabled:opacity-50"
      >
        {devSetupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
      </button>
    </div>
  )
}

