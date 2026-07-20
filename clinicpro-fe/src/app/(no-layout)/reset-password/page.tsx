"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2, ChevronLeft, ShieldCheck, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const idFromQuery = searchParams.get("identifier")
    if (idFromQuery) {
      setIdentifier(idFromQuery)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp.trim() || otp.length !== 6) {
      toast.error("Vui lòng nhập mã OTP 6 chữ số")
      return
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp")
      return
    }

    setLoading(true)
    try {
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "")
      const res = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || "Đặt lại mật khẩu thành công!")
        setTimeout(() => router.push("/login"), 1500)
      } else {
        toast.error(data.message || "Có lỗi xảy ra")
      }
    } catch {
      toast.error("Không thể kết nối đến server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12 w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Image
                src="/logos/LogoClinicPro-v1-noneBG.png"
                alt="ClinicPro Logo"
                width={32}
                height={32}
                className="brightness-0 invert"
              />
            </div>
            <span className="text-2xl font-bold text-white">ClinicPro</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Đặt lại mật khẩu</h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Nhập mã OTP đã được gửi và mật khẩu mới của bạn. Mã OTP có hiệu lực trong 5 phút.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
              <Image
                src="/logos/LogoClinicPro-v1-noneBG.png"
                alt="ClinicPro Logo"
                width={24}
                height={24}
                className="brightness-0 invert"
              />
            </div>
            <span className="text-xl font-bold text-teal-700">ClinicPro</span>
          </div>

          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push("/forgot-password")} className="pl-0 text-gray-500">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Quay lại
            </Button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
            <p className="text-sm text-gray-600 mt-1">
              Nhập mã OTP và mật khẩu mới cho{" "}
              <span className="font-medium text-gray-900">{identifier || "tài khoản của bạn"}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email hoặc Số điện thoại</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nguyenvana@gmail.com hoặc 0912345678"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Mã OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Nhập mã OTP 6 chữ số"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ít nhất 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Đặt lại mật khẩu
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-teal-600 hover:underline font-medium"
              >
                Quay lại đăng nhập
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
