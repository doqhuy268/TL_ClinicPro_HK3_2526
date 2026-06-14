// Bước 3: Hoàn tất đăng ký
"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { registerApi } from "@/lib/api";

function CompleteRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "male",
    address: "",
    citizenId: "",
    avatar: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    
    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      // Validate required fields
      if (!form.fullName.trim()) {
        setError("Vui lòng nhập họ và tên");
        setLoading(false);
        return;
      }
      
      if (!form.dateOfBirth) {
        setError("Vui lòng chọn ngày sinh");
        setLoading(false);
        return;
      }
      if (new Date(form.dateOfBirth) > new Date(todayStr)) {
        setError("Ngày sinh không được ở tương lai");
        setLoading(false);
        return;
      }
      
      if (!form.address.trim()) {
        setError("Vui lòng nhập địa chỉ");
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await registerApi.complete({
        sessionId,
        name: form.fullName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        address: form.address,
        citizenId: form.citizenId || undefined,
        avatar: form.avatar || undefined,
        password: form.password,
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/register");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hoàn tất đăng ký</h1>
          <p className="text-gray-600">Điền thông tin cá nhân để hoàn tất tài khoản</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/80 to-primary"></div>

          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-2xl font-semibold text-center text-gray-800">Thông tin cá nhân</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Vui lòng điền đầy đủ thông tin bên dưới
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Nhập họ và tên đầy đủ"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                      Ngày sinh <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      max={todayStr}
                      onChange={handleChange}
                      required
                      className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      Giới tính <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full h-12 border border-gray-200 rounded-lg px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Địa chỉ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Nhập địa chỉ hiện tại"
                      value={form.address}
                      onChange={handleChange}
                      required
                      className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Citizen ID */}
                  <div className="space-y-2">
                    <Label htmlFor="citizenId" className="text-sm font-medium text-gray-700">
                      Số CMND/CCCD
                    </Label>
                    <Input
                      id="citizenId"
                      name="citizenId"
                      placeholder="Nhập số CMND/CCCD"
                      value={form.citizenId}
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>

                  {/* Avatar */}
                  <div className="space-y-2">
                    <Label htmlFor="avatar" className="text-sm font-medium text-gray-700">
                      Link avatar
                    </Label>
                    <Input
                      id="avatar"
                      name="avatar"
                      placeholder="Nhập link ảnh đại diện"
                      value={form.avatar}
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Mật khẩu <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Nhập lại mật khẩu"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-12 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Required Fields Note */}
              <div className="text-sm text-gray-500 text-center">
                <span className="text-red-500">*</span> Các trường bắt buộc
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
                    <p className="text-green-600 text-sm font-medium">Đăng ký thành công! Đang chuyển hướng...</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang hoàn tất...
                  </>
                ) : (
                  "Hoàn tất đăng ký"
                )}
              </Button>
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
            Bằng cách hoàn tất đăng ký, bạn đồng ý với{" "}
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
  );
}

export default function CompleteRegistration() {
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
      <CompleteRegistrationContent />
    </Suspense>
  );
}
