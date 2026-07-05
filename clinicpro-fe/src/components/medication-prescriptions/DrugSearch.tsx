'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { drugSearchApi } from '@/lib/api';
import { DrugSearchResult } from '@/lib/types/medication-prescription';
import { Search, Pill, ChevronLeft, ChevronRight } from 'lucide-react';

interface DrugSearchProps {
  onSelectDrug?: (drug: DrugSearchResult) => void;
  showSelectButton?: boolean;
}

export function DrugSearch({ onSelectDrug, showSelectButton = false }: DrugSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setSelectedDrug] = useState<DrugSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;

  const handleSearch = async (page: number = 1) => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      setCurrentPage(page);
      
      const response = await drugSearchApi.search(searchTerm, { 
        limit: itemsPerPage,
        skip: (page - 1) * itemsPerPage
      });
      
      setSearchResults(response.data.results || []);
      setTotalResults(response.data.total || 0);
      setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error searching drugs:', error);
      setSearchResults([]);
      setTotalResults(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      handleSearch(page);
    }
  };

  const handleSelectDrug = (drug: DrugSearchResult) => {
    setSelectedDrug(drug);
    if (onSelectDrug) {
      onSelectDrug(drug);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-4">
        {/* Search Input and Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Nhập tên thuốc để tìm kiếm chính xác..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 w-full"
            />
          </div>

          <Button 
            onClick={() => handleSearch(1)} 
            disabled={loading || !searchTerm.trim()}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </Button>
        </div>
      </div>

      {/* Initial State - Before Search */}
      {!hasSearched && (
        <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Search className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Tìm kiếm thuốc</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Nhập tên thuốc vào ô tìm kiếm để tra cứu thông tin chi tiết về thuốc từ cơ sở dữ liệu OpenFDA.
            </p>
            
            {/* Search Tips */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 w-full max-w-md">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-500" />
                Mẹo tìm kiếm:
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Tìm theo tên thuốc (generic name)</li>
                <li>• Tìm theo tên thương hiệu (brand name)</li>
                <li>• Sử dụng từ khóa tiếng Anh</li>
                <li>• Kiểm tra chính tả cẩn thận</li>
              </ul>
            </div>
            
            <div className="mt-6 text-xs text-gray-400 text-center">
              Dữ liệu từ OpenFDA • Cập nhật thường xuyên
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Pill className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy thuốc</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Không có kết quả nào cho từ khóa &quot;<span className="font-medium text-gray-700">{searchTerm}</span>&quot;. 
                  Hãy thử với từ khóa khác hoặc kiểm tra chính tả.
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  Dữ liệu từ OpenFDA • Có thể cần thời gian để cập nhật
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {totalResults} kết quả
                  </Badge>
                  <span className="text-sm text-gray-600">
                    cho &quot;<span className="font-medium">{searchTerm}</span>&quot;
                  </span>
                  <span className="text-xs text-gray-500">
                    (Trang {currentPage}/{totalPages})
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Dữ liệu từ OpenFDA
                </div>
              </div>
              {searchResults.map((drug, index) => (
                <Card key={index} className="border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Document Header */}
                    <div className="border-b border-gray-300 pb-3 mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">
                          {drug.openfda?.generic_name || drug.openfda?.brand_name || 'Không rõ tên'}
                        </h3>
                        <div className="flex gap-2">
                          {showSelectButton && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSelectDrug(drug)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Chọn
                            </Button>
                          )}
                          <Dialog >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Chi tiết
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-6xl lg:max-w-5xl md:max-w-4xl  max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-lg font-bold">
                                  THÔNG TIN CHI TIẾT THUỐC
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Drug Name */}
                                <div className="border-b border-gray-300 pb-4">
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {drug.openfda?.generic_name || drug.openfda?.brand_name || 'Không rõ tên'}
                                  </h3>
                                  {drug.openfda?.brand_name && drug.openfda.brand_name !== drug.openfda.generic_name && (
                                    <p className="text-md text-gray-600 mt-1">
                                      Thương hiệu: {drug.openfda.brand_name}
                                    </p>
                                  )}
                                </div>

                                {/* Basic Information */}
                                <div className="space-y-3">
                                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">THÔNG TIN CƠ BẢN</h4>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    {drug.openfda?.generic_name && (
                                      <div>
                                        <span className="font-medium text-gray-600">Tên chung:</span>
                                        <span className="ml-2">{drug.openfda.generic_name}</span>
                                      </div>
                                    )}
                                    {drug.openfda?.brand_name && (
                                      <div>
                                        <span className="font-medium text-gray-600">Thương hiệu:</span>
                                        <span className="ml-2">{drug.openfda.brand_name}</span>
                                      </div>
                                    )}
                                    {drug.openfda?.manufacturer_name && (
                                      <div className="col-span-3">
                                        <span className="font-medium text-gray-600">Nhà sản xuất:</span>
                                        <span className="ml-2">{drug.openfda.manufacturer_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Medical Information */}
                                <div className="space-y-3">
                                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">THÔNG TIN Y TẾ</h3>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    {drug.openfda?.dosage_form && (
                                      <div>
                                        <span className="font-medium text-gray-600">Dạng bào chế:</span>
                                        <span className="ml-2">{drug.openfda.dosage_form}</span>
                                      </div>
                                    )}
                                    {drug.openfda?.route && (
                                      <div>
                                        <span className="font-medium text-gray-600">Đường dùng:</span>
                                        <span className="ml-2">{drug.openfda.route}</span>
                                      </div>
                                    )}
                                    {drug.strength && (
                                      <div>
                                        <span className="font-medium text-gray-600">Liều lượng:</span>
                                        <span className="ml-2">{drug.strength}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Indications */}
                                {drug.indications_and_usage && (
                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">CHỈ ĐỊNH & CÔNG DỤNG</h3>
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                      {drug.indications_and_usage}
                                    </div>
                                  </div>
                                )}

                                {/* Dosage & Administration */}
                                {drug.dosage_and_administration && (
                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">LIỀU DÙNG & CÁCH SỬ DỤNG</h3>
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                      {drug.dosage_and_administration}
                                    </div>
                                  </div>
                                )}

                                {/* Warnings */}
                                {drug.warnings && (
                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">CẢNH BÁO QUAN TRỌNG</h3>
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                      {drug.warnings}
                                    </div>
                                  </div>
                                )}

                                {/* Contraindications */}
                                {drug.contraindications && (
                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">CHỐNG CHỈ ĐỊNH</h3>
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                      {drug.contraindications}
                                    </div>
                                  </div>
                                )}

                                {/* Adverse Reactions */}
                                {drug.adverse_reactions && (
                                  <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">TÁC DỤNG PHỤ</h3>
                                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                      {drug.adverse_reactions}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>

                    {/* Document Content */}
                    <div className="space-y-3">
                      {/* Basic Info */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {drug.openfda?.brand_name && drug.openfda.brand_name !== drug.openfda.generic_name && (
                          <div>
                            <span className="font-medium text-gray-600">Thương hiệu:</span>
                            <span className="ml-2">{drug.openfda.brand_name}</span>
                          </div>
                        )}
                        {drug.openfda?.dosage_form && (
                          <div>
                            <span className="font-medium text-gray-600">Dạng bào chế:</span>
                            <span className="ml-2">{drug.openfda.dosage_form}</span>
                          </div>
                        )}
                        {drug.openfda?.route && (
                          <div>
                            <span className="font-medium text-gray-600">Đường dùng:</span>
                            <span className="ml-2">{drug.openfda.route}</span>
                          </div>
                        )}
                        {drug.strength && (
                          <div>
                            <span className="font-medium text-gray-600">Liều lượng:</span>
                            <span className="ml-2">{drug.strength}</span>
                          </div>
                        )}
                        {drug.openfda?.manufacturer_name && (
                          <div className="col-span-3">
                            <span className="font-medium text-gray-600">Nhà sản xuất:</span>
                            <span className="ml-2">{drug.openfda.manufacturer_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Indications Preview */}
                      {drug.indications_and_usage && (
                        <div className="border-t border-gray-200 pt-3">
                          <div className="text-sm">
                            <span className="font-medium text-gray-600">Chỉ định:</span>
                            <p className="mt-1 text-gray-700 line-clamp-2">
                              {drug.indications_and_usage.length > 200 
                                ? `${drug.indications_and_usage.substring(0, 200)}...` 
                                : drug.indications_and_usage}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={loading}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="flex items-center gap-1"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}