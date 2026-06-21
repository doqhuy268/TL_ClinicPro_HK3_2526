
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BannerSlider } from "@/components/ui/banner-slider";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { 
  Heart, 
  Shield, 
  Users, 
  Calendar, 
  Phone, 
  MapPin,
  Stethoscope,
  Clock,
  CheckCircle,
  ArrowRight,
  Smartphone
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Slider */}
      <BannerSlider />

      {/* Introduction Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Giới thiệu về <span className="text-primary">ClinicPro</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                ClinicPro là hệ thống quản lý phòng khám toàn diện, được thiết kế để kết nối bác sĩ, 
                bệnh nhân và nhân viên y tế một cách hiệu quả và thông minh.
              </p>
              <p className="text-lg text-gray-600 ">
                Với công nghệ hiện đại và giao diện thân thiện, ClinicPro giúp tối ưu hóa quy trình đặt lịch khám, 
                khám chữa bệnh, nâng cao chất lượng dịch vụ y tế.
              </p>
              
            </div>
            <div className="relative">
              <div className="relative h-90 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/imgs/banner6.png"
                  alt="ClinicPro Hospital System"
                  fill
                  className="object-fill"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Tại sao chọn ClinicPro?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chúng tôi cung cấp giải pháp toàn diện cho việc quản lý bệnh viện và chăm sóc sức khỏe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-rose-500" />
                </div>
                <CardTitle className="text-xl">Chăm sóc tận tâm</CardTitle>
                <CardDescription className="text-base">
                  Đội ngũ bác sĩ giàu kinh nghiệm, luôn đặt sức khỏe bệnh nhân lên hàng đầu với 
                  phương pháp điều trị hiện đại và hiệu quả.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Bảo mật thông tin</CardTitle>
                <CardDescription className="text-base">
                  Hệ thống bảo mật cao với mã hóa end-to-end, đảm bảo thông tin cá nhân và hồ sơ bệnh án 
                  được bảo vệ tuyệt đối theo tiêu chuẩn quốc tế.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-emerald-500" />
                </div>
                <CardTitle className="text-xl">Quản lý hiệu quả</CardTitle>
                <CardDescription className="text-base">
                  Hệ thống quản lý toàn diện với AI và machine learning, giúp tối ưu hóa quy trình 
                  làm việc và nâng cao chất lượng dịch vụ y tế.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-violet-500" />
                </div>
                <CardTitle className="text-xl">Đặt lịch thông minh</CardTitle>
                <CardDescription className="text-base">
                  Đặt lịch khám bệnh trực tuyến với AI gợi ý thời gian phù hợp, tiết kiệm thời gian 
                  và thuận tiện cho bệnh nhân mọi lúc, mọi nơi.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Phone className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-xl">Hỗ trợ 24/7</CardTitle>
                <CardDescription className="text-base">
                  Đội ngũ hỗ trợ khách hàng chuyên nghiệp luôn sẵn sàng giải đáp mọi thắc mắc và 
                  hỗ trợ khi cần thiết qua nhiều kênh liên lạc.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-sky-500" />
                </div>
                <CardTitle className="text-xl">Vị trí thuận tiện</CardTitle>
                <CardDescription className="text-base">
                  Bệnh viện đặt tại vị trí trung tâm thành phố, dễ dàng di chuyển và tiếp cận các 
                  dịch vụ y tế với hệ thống giao thông thuận tiện.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Dịch vụ y tế chuyên nghiệp
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chúng tôi cung cấp đầy đủ các dịch vụ y tế từ cơ bản đến chuyên sâu
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="relative">
              <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/imgs/banner5.png"
                  alt="Medical Services"
                  fill
                  className="object-cover"
                />
               
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Chuyên khoa đa dạng
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-lg text-gray-700">Tim mạch & Huyết áp</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-lg text-gray-700">Nội tiết & Tiểu đường</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-lg text-gray-700">Thần kinh & Tâm thần</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-lg text-gray-700">Nhi khoa & Sản phụ khoa</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span className="text-lg text-gray-700">Chẩn đoán hình ảnh</span>
                </div>
              </div>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/public/specialties">
                  Xem tất cả dịch vụ
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Công nghệ tiên tiến
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ứng dụng công nghệ hiện đại để mang lại trải nghiệm tốt nhất cho bệnh nhân
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ứng dụng di động</h3>
              <p className="text-gray-600 mb-6">
                Truy cập mọi lúc, mọi nơi với ứng dụng di động thông minh, 
                đặt lịch khám và quản lý hồ sơ bệnh án dễ dàng.
              </p>
            </Card>

            <Card className="text-center p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Stethoscope className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Chẩn đoán AI</h3>
              <p className="text-gray-600 mb-6">
                Hỗ trợ chẩn đoán bằng trí tuệ nhân tạo, tăng độ chính xác 
                và giảm thời gian chờ đợi cho bệnh nhân.
              </p>
            </Card>

            <Card className="text-center p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tối ưu thời gian</h3>
              <p className="text-gray-600 mb-6">
                Hệ thống quản lý lịch thông minh, giảm thời gian chờ đợi 
                và tối ưu hóa quy trình khám chữa bệnh.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary to-primary/90 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-3">
              Thành tựu của chúng tôi
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Những con số ấn tượng phản ánh chất lượng dịch vụ và sự tin tưởng của khách hàng
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-white/90 text-lg">Bệnh nhân đã tin tưởng</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl font-bold text-white mb-2">200+</div>
              <div className="text-white/90 text-lg">Bác sĩ chuyên khoa</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/90 text-lg">Hỗ trợ khách hàng</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
              <div className="text-4xl font-bold text-white mb-2">99%</div>
              <div className="text-white/90 text-lg">Hài lòng khách hàng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Sẵn sàng bắt đầu hành trình chăm sóc sức khỏe?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Đăng ký ngay để trải nghiệm dịch vụ chăm sóc sức khỏe tốt nhất với công nghệ hiện đại
          </p>
        </div>
      </section>
    </div>
  );
}

