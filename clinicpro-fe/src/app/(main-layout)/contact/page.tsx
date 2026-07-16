'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Send,
  MessageCircle,
  Users,
  Award,
  Shield,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: { [k: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+()\-\s]{8,20}$/; // simple loose phone validation

    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập họ và tên';
    if (!formData.email.trim() || !emailRegex.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (formData.phone && !phoneRegex.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!formData.subject.trim() || formData.subject.trim().length < 3) newErrors.subject = 'Chủ đề cần ít nhất 3 ký tự';
    if (!formData.message.trim() || formData.message.trim().length < 10) newErrors.message = 'Nội dung cần ít nhất 10 ký tự';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Gửi tin nhắn thất bại');
      }
      toast.success('Đã gửi tin nhắn thành công');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 py-6">
          <div className="w-full mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Liên hệ với <span className="text-primary">chúng tôi</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-6">
        <div className=" mx-auto">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông tin liên hệ</h2>
              {/* Contact Cards */}
              <div className="space-y-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border h-44 border-gray-200 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Điện thoại</h3>
                        <p className="text-gray-600">Hotline: <span className="font-medium text-primary">1900 1234</span></p>
                        <p className="text-gray-600">Tư vấn: <span className="font-medium">024 1234 5678</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border h-44 border-gray-200 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                        <p className="text-gray-600">Hỗ trợ: <span className="font-medium text-primary">support@ClinicPro.com</span></p>
                        <p className="text-gray-600">Liên hệ: <span className="font-medium">contact@ClinicPro.com</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border h-44 border-gray-200 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Địa chỉ</h3>
                        <p className="text-gray-600">Trụ sở chính: <span className="font-medium">Đường Nguyễn Văn Bảo, Quận Gò Vấp, TP.HCM</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Two-column: Contact Form (2/3) + Additional Information (1/3) */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Contact Form */}
            <div className="lg:col-span-2 h-full">
              <Card className="border border-gray-200 shadow-sm p-0 h-full flex flex-col">
                <CardHeader className="bg-gray-50 px-6 py-8">
                  <CardTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-8 w-8 text-primary" />
                    Gửi tin nhắn cho chúng tôi
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 flex-1">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Họ và tên *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Nhập họ và tên"
                          aria-invalid={!!errors.name}
                          className={`h-12 focus:ring-primary/20 ${errors.name ? 'border-red-500 focus:border-red-500 ring-red-200' : 'border-gray-300 focus:border-primary'}`}
                        />
                        {errors.name ? (
                          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        ) : null}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Nhập email"
                          aria-invalid={!!errors.email}
                          className={`h-12 focus:ring-primary/20 ${errors.email ? 'border-red-500 focus:border-red-500 ring-red-200' : 'border-gray-300 focus:border-primary'}`}
                        />
                        {errors.email ? (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid grid-cols-1  gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Số điện thoại
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Nhập số điện thoại"
                          aria-invalid={!!errors.phone}
                          className={`h-12 focus:ring-primary/20 ${errors.phone ? 'border-red-500 focus:border-red-500 ring-red-200' : 'border-gray-300 focus:border-primary'}`}
                        />
                        {errors.phone ? (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        ) : null}
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          Chủ đề *
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="Nhập chủ đề"
                          aria-invalid={!!errors.subject}
                          className={`h-12 focus:ring-primary/20 ${errors.subject ? 'border-red-500 focus:border-red-500 ring-red-200' : 'border-gray-300 focus:border-primary'}`}
                        />
                        {errors.subject ? (
                          <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung tin nhắn *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Nhập nội dung tin nhắn của bạn..."
                        aria-invalid={!!errors.message}
                        className={`h-48 focus:ring-primary/20 ${errors.message ? 'border-red-500 focus:border-red-500 ring-red-200' : 'border-gray-300 focus:border-primary'}`}
                      />
                      {errors.message ? (
                        <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                      ) : null}
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex w-1/2 py-4 mx-auto bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            {/* Additional Information */}
            <div className="lg:col-span-1 h-full">
              <div className="text-left mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tại sao chọn ClinicPro?</h2>
                <p className="text-gray-600">
                  Chúng tôi cam kết mang đến dịch vụ y tế chất lượng cao với đội ngũ chuyên gia giàu kinh nghiệm
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <Card className="text-center p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Đội ngũ chuyên gia</h3>
                  <p className="text-gray-600 text-sm">
                    Hơn 200 bác sĩ chuyên khoa giàu kinh nghiệm, luôn sẵn sàng phục vụ
                  </p>
                </Card>
                <Card className="text-center p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Chất lượng dịch vụ</h3>
                  <p className="text-gray-600 text-sm">
                    Tiêu chuẩn quốc tế với trang thiết bị hiện đại và quy trình chuyên nghiệp
                  </p>
                </Card>
                <Card className="text-center p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Bảo mật thông tin</h3>
                  <p className="text-gray-600 text-sm">
                    Hệ thống bảo mật cao, đảm bảo thông tin cá nhân và hồ sơ bệnh án an toàn
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

