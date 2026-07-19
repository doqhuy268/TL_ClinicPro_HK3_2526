"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2, ChevronLeft, Mail, Phone, KeyRound } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [otpDev, setOtpDev] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!identifier.trim()) {
      toast.error("Vui lòng nhập email hoặc số điện thoại")
      return
    }

    setLoading(true)
    try {
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "")
      const res = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        setSent(true)
        // Hiển thị OTP nếu có (dev mode)
        if (data.otpDev) {
          setOtpDev(data.otpDev)
        }
        toast.success(data.message || "Mã OTP đã được gửi")
      } else {
        toast.error(data.message || "Có lỗi xảy ra")
      }
    } catch {
      toast.error("Không thể kết nối đến server")
    } finally {
      setLoading(false)
    }
  }

  const handleGoToReset = () => {
    router.push(`/reset-password?identifier=${encodeURIComponent(identifier.trim())}`)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Kiểm tra email / điện thoại</CardTitle>
            <CardDescription>
              Mã OTP đã được gửi đến <span className="font-medium text-gray-900">{identifier}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {otpDev && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-700 font-medium mb-1">🔧 DEV MODE - OTP:</p>
                <p className="text-2xl font-bold text-amber-800 tracking-widest">{otpDev}</p>
              </div>
            )}
            <Button onClick={handleGoToReset} className="w-full">
              Tiếp tục đặt lại mật khẩu
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Quay lại đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
          <h2 className="text-4xl font-bold text-white mb-4">Quên mật khẩu?</h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-md">
            Đừng lo lắng! Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP đặt lại mật khẩu.
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
            <Button variant="ghost" onClick={() => router.push("/login")} className="pl-0 text-gray-500">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Quay lại đăng nhập
            </Button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
            <p className="text-sm text-gray-600 mt-1">
              Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email hoặc Số điện thoại</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {identifier.includes("@") ? (
                    <Mail className="h-4 w-4" />
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                </span>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="nguyenvana@gmail.com hoặc 0912345678"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi OTP...
                </>
              ) : (
                <>
                  Gửi mã OTP
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
