'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { publicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { doctorRatingService, type DoctorRating, type DoctorRatingStats } from '@/lib/services/doctor-rating.service';
import { 
  Search, 
  Star, 
  Award, 
  TrendingUp, 
  Clock, 
  Users,
  Sparkles,
  Activity,
  Shield,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === 'object' && err !== null) {
    const maybe = err as { response?: { data?: { message?: string } } };
    const msgFromResponse = maybe.response?.data?.message;
    if (typeof msgFromResponse === 'string' && msgFromResponse.length > 0) return msgFromResponse;
    const maybeMsg = (err as { message?: unknown }).message;
    if (typeof maybeMsg === 'string' && maybeMsg.length > 0) return maybeMsg;
  }
  return fallback;
}

type PublicDoctor = {
  id: string;
  name: string;
  avatar?: string;
  doctor: {
    id: string;
    doctorCode: string;
    yearsExperience?: number;
    rating?: number;
    workHistory?: string;
    description?: string;
    specialty: { id: string; specialtyCode: string; name: string };
  };
};

export default function DoctorsPage() {
  const [data, setData] = useState<PublicDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isRatingsDialogOpen, setIsRatingsDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<PublicDoctor | null>(null);
  const [doctorRatings, setDoctorRatings] = useState<DoctorRating[]>([]);
  const [doctorStats, setDoctorStats] = useState<DoctorRatingStats | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState<string | null>(null);
  const [ratingsPage, setRatingsPage] = useState(1);
  const ratingsPerPage = 5;
  const [ratingsTotal, setRatingsTotal] = useState(0);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.getDoctors();
        setData(res.data || []);
      } catch (e: unknown) {
        setError(getErrorMessage(e, 'Không thể tải danh sách bác sĩ'));
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredDoctors = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const query = searchTerm.trim().toLowerCase();
    return data.filter((doctor) => {
      const haystack = [
        doctor.name,
        doctor.doctor.specialty?.name,
        doctor.doctor.specialty?.specialtyCode,
        doctor.doctor.doctorCode,
      ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());
      return haystack.some((value) => value.includes(query));
    });
  }, [data, searchTerm]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredDoctors.length / itemsPerPage)), [filteredDoctors.length]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex]);
  const currentDoctors = useMemo(() => filteredDoctors.slice(startIndex, endIndex), [filteredDoctors, startIndex, endIndex]);

  const openRatingsDialog = (doctor: PublicDoctor) => {
    setSelectedDoctor(doctor);
    setRatingsPage(1);
    setIsRatingsDialogOpen(true);
  };

  useEffect(() => {
    const fetchRatings = async () => {
      if (!isRatingsDialogOpen || !selectedDoctor) return;
      try {
        setRatingsLoading(true);
        setRatingsError(null);
        const [stats, ratingsResult] = await Promise.all([
          doctorRatingService.getDoctorStats(selectedDoctor.doctor.id),
          doctorRatingService.getRatingsByDoctor(selectedDoctor.doctor.id, ratingsPage, ratingsPerPage),
        ]);
        setDoctorStats(stats);
        const ratingList = Array.isArray(ratingsResult)
          ? ratingsResult
          : ratingsResult.data || [];
        setDoctorRatings(ratingList);
        const total = Array.isArray(ratingsResult) ? ratingList.length : ratingsResult.meta?.total ?? ratingList.length;
        setRatingsTotal(total);
      } catch (e) {
        setDoctorStats(null);
        setDoctorRatings([]);
        setRatingsError(getErrorMessage(e, 'Không thể tải đánh giá'));
      } finally {
        setRatingsLoading(false);
      }
    };
    fetchRatings();
  }, [isRatingsDialogOpen, selectedDoctor, ratingsPage]);

  const RatingStars = ({ value }: { value: number }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={value >= star ? 'h-4 w-4 text-yellow-400 fill-yellow-400' : 'h-4 w-4 text-gray-300'} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-linear-to-b from-[#f0f9ff] to-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-linear-to-tr from-blue-50 to-transparent rounded-full blur-2xl"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3 w-3 mr-1" />
                Đội ngũ chuyên nghiệp
              </Badge>
              <Badge variant="outline" className="border-green-200 text-green-700">
                <Activity className="h-3 w-3 mr-1" />
                Luôn sẵn sàng
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Đội ngũ bác sĩ <span className="text-primary relative">
                giàu kinh nghiệm
              </span>
            </h1>
            <p className="mt-3 text-gray-600 text-base sm:text-lg max-w-3xl mx-auto">
              Tìm bác sĩ phù hợp theo chuyên khoa và đặt lịch khám nhanh chóng với đội ngũ chuyên gia hàng đầu.
            </p>
            
            
          </div>
        </div>
      </section>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className=" mx-auto">
          <div className="text-center mb-4"></div>

          <div className="max-w-2xl mx-auto mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm bác sĩ theo tên, mã hoặc chuyên khoa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-5 border-gray-300 focus:border-primary focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {loading ? 'Đang tải...' : `${filteredDoctors.length} bác sĩ`}
              </span>
            </div>
            {searchTerm && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                Đang lọc
              </Badge>
            )}
          </div>

          <div className="space-y-6">
            {currentDoctors.map((d) => (
              <Card key={d.id} className="border border-gray-200 w-[85%] mx-auto bg-white hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-linear-to-br from-primary/5 to-transparent rounded-full blur-xl opacity-50"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-40 h-40 sm:w-40 sm:h-40 rounded-xl overflow-hidden shrink-0 relative group-hover:scale-105 transition-transform duration-300 ">
                        <Image
                          unoptimized
                          src={d.avatar || '/logos/LogoClinicPro-v2-noneBG.png'}
                          alt={d.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{d.name}</h3>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {d.doctor.specialty?.name}
                        </Badge>
                        {d.doctor.yearsExperience !== undefined && (
                          <Badge variant="outline" className="border-amber-200 text-amber-700">
                            <Award className="h-3 w-3 mr-1" />
                            {d.doctor.yearsExperience}+ năm
                          </Badge>
                        )}
                        {typeof d.doctor.rating === 'number' && (
                          <Badge variant="outline" className="border-yellow-200 text-yellow-700 flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            {d.doctor.rating.toFixed(1)}
                          </Badge>
                        )}
                        <Button variant="outline" size="sm" className="text-xs hover:bg-transparent hover:text-primary " onClick={() => openRatingsDialog(d)}>
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Xem đánh giá
                        </Button>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <p className="text-xs text-gray-500 font-medium">Mã bác sĩ</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{d.doctor.doctorCode}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="text-xs text-gray-500 font-medium">Chuyên khoa</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{d.doctor.specialty?.name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                      {d.doctor.workHistory && (
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Kinh nghiệm</p>
                              <p className="text-sm text-gray-600">{d.doctor.workHistory}</p>
                            </div>
                          </div>
                        )}
                      {d.doctor.description && (
                        <div className="flex items-start gap-3">
                          <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Giới thiệu</p>
                              <p className="text-sm text-gray-600">{d.doctor.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {loading && (
            <div className="text-center text-sm text-gray-500 mt-6">Đang tải...</div>
          )}
          {!loading && !error && data.length === 0 && (
            <div className="text-center text-sm text-gray-500 mt-6">Không có bác sĩ phù hợp</div>
          )}
          {error && (
            <div className="text-center text-sm text-red-600 mt-6">{error}</div>
          )}

          {/* Pagination */}
          {!loading && filteredDoctors.length > 0 && (
            <div className="mt-8 mb-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={isRatingsDialogOpen} onOpenChange={(open) => (!open ? setIsRatingsDialogOpen(false) : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Đánh giá bác sĩ {selectedDoctor?.name}</DialogTitle>
            <DialogDescription>Xem nhận xét từ bệnh nhân về bác sĩ này.</DialogDescription>
          </DialogHeader>
          {ratingsLoading ? (
            <div className="py-6 text-center text-sm text-gray-500">Đang tải đánh giá...</div>
          ) : ratingsError ? (
            <div className="py-6 text-center text-sm text-red-600">{ratingsError}</div>
          ) : (
            <div className="space-y-4">
              {doctorStats && (
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Điểm trung bình</p>
                      <div className="flex items-center gap-2">
                        <RatingStars value={doctorStats.averageRating || 0} />
                        <span className="text-lg font-semibold text-gray-900">
                          {(doctorStats.averageRating ?? 0).toFixed(1)} / 5
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{doctorStats.totalRatings || 0} lượt đánh giá</p>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1 w-full sm:w-1/2">
                      {(doctorStats.ratingDistribution || [])
                        .slice()
                        .sort((a, b) => b.rating - a.rating)
                        .map((item) => (
                          <div key={item.rating} className="flex items-center gap-2">
                            <span>{item.rating}★</span>
                            <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400"
                                style={{
                                  width: doctorStats.totalRatings
                                    ? `${item.percentage ?? (item.count / doctorStats.totalRatings) * 100}%`
                                    : '0%',
                                }}
                              />
                            </div>
                            <span>{item.count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  {doctorStats.recentComments && doctorStats.recentComments.length > 0 && (
                    <div className="border-t border-gray-200 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700">Nhận xét gần đây</p>
                      {doctorStats.recentComments.slice(0, 3).map((c) => (
                        <div key={c.id} className="text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <RatingStars value={c.rating} />
                            <span className="font-medium">{c.patientName}</span>
                          </div>
                          <span className="text-[11px] text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                          {c.comment && <p className="text-gray-700 mt-1 sm:mt-0">{c.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {doctorRatings.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-6">Chưa có đánh giá nào.</div>
              ) : (
                <div className="space-y-3">
                  {doctorRatings.map((rating) => (
                    <div key={rating.id} className="rounded-lg border border-gray-200 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <RatingStars value={rating.rating} />
                        <span className="text-xs text-gray-500">
                          {new Date(rating.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      {rating.comment ? (
                        <p className="text-sm text-gray-700">{rating.comment}</p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Không có nhận xét.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ratingsTotal > ratingsPerPage && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRatingsPage((p) => Math.max(1, p - 1))}
                    disabled={ratingsPage === 1}
                  >
                    Trang trước
                  </Button>
                  <span className="text-xs text-gray-500">
                    Trang {ratingsPage} / {Math.max(1, Math.ceil(ratingsTotal / ratingsPerPage))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRatingsPage((p) => Math.min(Math.ceil(ratingsTotal / ratingsPerPage), p + 1))}
                    disabled={ratingsPage >= Math.ceil(ratingsTotal / ratingsPerPage)}
                  >
                    Trang sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



