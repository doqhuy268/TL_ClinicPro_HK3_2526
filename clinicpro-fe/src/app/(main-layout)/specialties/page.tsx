'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { publicApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { 
  Stethoscope, 
  Award, 
  TrendingUp, 
  Shield,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type PublicSpecialty = {
  id: string;
  specialtyCode: string;
  name: string;
  imgUrl?: string;
  description?: string;
};

export default function SpecialtiesPage() {
  const [specialties, setSpecialties] = useState<PublicSpecialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.getSpecialties();
        setSpecialties(res.data || []);
      } catch (e: unknown) {
        const maybe = e as { response?: { data?: { message?: string } }; message?: unknown };
        const message = typeof maybe.response?.data?.message === 'string' && maybe.response.data.message.length > 0
          ? maybe.response.data.message
          : typeof maybe.message === 'string' && maybe.message.length > 0
          ? maybe.message
          : 'Không thể tải danh sách chuyên khoa';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialties();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(specialties.length / itemsPerPage)), [specialties.length]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex]);
  const currentItems = useMemo(() => specialties.slice(startIndex, endIndex), [specialties, startIndex, endIndex]);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-b from-[#f0f9ff] to-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-50 to-transparent rounded-full blur-2xl"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="max-w-5xl mx-auto text-center">
            
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4">
              Các khoa của <span className="text-primary relative">
                bệnh viện
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full"></div>
              </span>
            </h1>
            <p className="mt-3 text-gray-600 text-base sm:text-lg max-w-3xl mx-auto">
              Khám phá chuyên khoa và dịch vụ phù hợp với nhu cầu của bạn với đội ngũ chuyên gia hàng đầu.
            </p>
            
            
          </div>
        </div>
      </section>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className=" mx-auto">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {loading ? 'Đang tải...' : `${specialties.length} chuyên khoa`}
              </span>
            </div>
            <Badge variant="secondary" className="bg-green-100 py-2 rounded-full text-green-700">
              <Shield className="h-3 w-3 mr-1" />
              Đầy đủ dịch vụ
            </Badge>
          </div>

          <div className="space-y-6">
            {currentItems.map((dept) => (
              <Card key={dept.id} className="border w-full mx-auto border-gray-200 bg-white hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl opacity-50"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden flex-shrink-0 relative">
                        <Image
                          unoptimized
                          src={dept.imgUrl || '/logos/LogoClinicPro-v2-noneBG.png'}
                          alt={dept.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                     
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <CardTitle className="text-xl font-bold text-gray-900">{dept.name}</CardTitle>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {dept.specialtyCode}
                        </Badge>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          <Award className="h-3 w-3 mr-1" />
                          Chuyên khoa
                        </Badge>
                      </div>
                      
                      {dept.description && (
                        <div className="flex items-start gap-3 mb-4">
                          <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Mô tả</p>
                            <p className="text-sm text-gray-600 line-clamp-3">{dept.description}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-xs text-gray-500 font-medium">Mã: {dept.specialtyCode}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-500">Chuyên khoa uy tín</span>
                        </div>
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
          {!loading && !error && specialties.length === 0 && (
            <div className="text-center text-sm text-gray-500 mt-6">Không có chuyên khoa</div>
          )}
          {error && (
            <div className="text-center text-sm text-red-600 mt-6">{error}</div>
          )}

          {/* Pagination */}
          {!loading && specialties.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-2">
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
    </div>
  );
}



