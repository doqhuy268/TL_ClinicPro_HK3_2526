"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Phone, Mail, ArrowRight, Loader2 } from "lucide-react"
import Image from "next/image"
import { registerApi } from "@/lib/api"

export default function RegisterPage() {
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEmailMode, setIsEmailMode] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await registerApi.step1({
        phone,
        email
      });

      router.push(`/register/verify-otp?sessionId=${response.data.sessionId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết nối máy chủ")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    // Handle Google login logic here
    console.log("Google login clicked")
  }

  const toggleMode = () => {
    setIsEmailMode(!isEmailMode)
    setPhone("")
    setEmail("")
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-2 p-2">
            <Image
              src="/logos/LogoClinicPro-v2-noneBG.png"
              alt="ClinicPro Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 ">Chào mừng đến với ClinicPro!</h1>
          {/* <p className="text-gray-600">Tạo tài khoản mới để đặt lịch khám</p> */}
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary"></div>

          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl font-semibold text-center text-gray-800">Đăng ký tài khoản</CardTitle>
            <CardDescription className="text-center text-gray-600">
              {isEmailMode ? "Nhập email để tiếp tục" : "Nhập số điện thoại để tiếp tục"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dynamic Input Field */}
              <div className="space-y-2">
                <Label htmlFor={isEmailMode ? "email" : "phone"} className="text-sm font-medium text-gray-700">
                  {isEmailMode ? "Email" : "Số điện thoại"}
                </Label>
                <div className="relative group">
                  {isEmailMode ? (
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary w-5 h-5 transition-colors" />
                  ) : (
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary w-5 h-5 transition-colors" />
                  )}
                  <Input
                    id={isEmailMode ? "email" : "phone"}
                    placeholder={isEmailMode ? "Nhập địa chỉ email của bạn" : "Nhập số điện thoại của bạn"}
                    value={isEmailMode ? email : phone}
                    onChange={(e) => (isEmailMode ? setEmail(e.target.value) : setPhone(e.target.value))}
                    type={isEmailMode ? "email" : "tel"}
                    className="pl-10 h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Toggle Mode Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-primary hover:text-primary/80 text-sm font-medium hover:underline transition-colors"
                >
                  {isEmailMode ? "Đăng ký bằng số điện thoại" : "Đăng ký bằng email"}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-in slide-in-from-top-2">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                disabled={loading || (isEmailMode ? !email : !phone)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    Tiếp tục
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">hoặc</span>
                </div>
              </div>

              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full h-12 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md bg-transparent"
              >
                <Image src="/socials/google.svg" alt="Google" width={20} height={20} className="mr-3" />
                <span className="font-medium text-gray-700">Đăng ký với Google</span>
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <a
                  href="/login"
                  className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                >
                  Đăng nhập ngay
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            Bằng cách tiếp tục, bạn đồng ý với{" "}
            <a href="/terms" className="text-primary hover:underline">
              Điều khoản dịch vụ
            </a>{" "}
            và{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Chính sách bảo mật
            </a>{" "}
            của chúng tôi
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/5 rounded-full blur-xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-xl -z-10"></div>
      </div>
    </div>
  )
}

