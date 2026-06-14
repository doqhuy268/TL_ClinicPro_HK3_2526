"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Loader2, CheckCircle } from "lucide-react";
import Image from "next/image";
import { registerApi } from "@/lib/api";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Chỉ cho phép 1 ký tự
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Tự động chuyển sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await registerApi.verifyOtp({
        sessionId,
        otp: otpString
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/register/complete?sessionId=${sessionId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã OTP không đúng. Vui lòng thử lại");
      // Reset OTP khi sai
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    try {
      await registerApi.resendOtp({ sessionId });
      setCountdown(60); // Bắt đầu đếm ngược 60 giây
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại mã OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6 p-2">
            <Image
              src="/logos/LogoClinicPro-v2-noneBG.png"
              alt="ClinicPro Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Xác thực tài khoản</h1>
          <p className="text-gray-600">Nhập mã OTP đã được gửi đến thiết bị của bạn</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary"></div>

          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl font-semibold text-center text-gray-800">Nhập mã OTP</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Mã xác thực 6 số đã được gửi đến thiết bị của bạn
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input Fields */}
              <div className="space-y-4">
                <div className="flex justify-center space-x-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white"
                      placeholder=""
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Nhập 6 số từ mã OTP đã được gửi
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-in slide-in-from-top-2">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-600 text-sm font-medium">Xác thực thành công! Đang chuyển hướng...</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                disabled={loading || otp.join("").length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  "Xác thực"
                )}
              </Button>

              {/* Resend Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading || countdown > 0}
                  className="text-primary hover:text-primary/80 text-sm font-medium hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin inline" />
                      Đang gửi lại...
                    </>
                  ) : countdown > 0 ? (
                    `Gửi lại mã OTP (${countdown}s)`
                  ) : (
                    "Gửi lại mã OTP"
                  )}
                </button>
              </div>
            </form>

            {/* Back Button */}
            <div className="text-center pt-4 border-t border-gray-100">
              <button
                onClick={handleBack}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            Mã OTP có hiệu lực trong 5 phút. Vui lòng kiểm tra tin nhắn SMS hoặc email của bạn.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/5 rounded-full blur-xl -z-10"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-xl -z-10"></div>
      </div>
    </div>
  );
}

export default function VerifyOtp() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></span>
            Đang tải...
          </div>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
