/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DrugSearch } from './DrugSearch';
import { DrugSearchResult } from '@/lib/types/medication-prescription';
import { Search, Package, ChevronDown } from 'lucide-react';

interface DrugInputProps {
  value: {
    name: string;
    ndc?: string;
    strength?: string;
    dosageForm?: string;
    route?: string;
    dose?: number;
    doseUnit?: string;
    frequency?: string;
    durationDays?: number;
    quantity?: number;
    quantityUnit?: string;
    instructions?: string;
  };
  onChange: (value: any) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

// Component Input với dropdown gợi ý
function InputWithSuggestions({ 
  value, 
  onChange, 
  suggestions, 
  placeholder, 
  className = "" 
}: { 
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    if (inputValue) {
      const filtered = suggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
    setIsOpen(true);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setFilteredSuggestions(suggestions);
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`${className} pr-8`}
        />
        <ChevronDown 
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-b-0"
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DrugInput({ value, onChange, onRemove, showRemove = true }: DrugInputProps) {
  const [showSearch, setShowSearch] = useState(false);

  const parseDurationDays = (input: string | number | undefined): number | undefined => {
    if (input === undefined || input === null) return undefined;
    if (typeof input === 'number') {
      if (Number.isNaN(input)) return undefined;
      return Math.max(1, Math.floor(input));
    }
    const match = String(input).match(/\d+/);
    if (!match) return undefined;
    const n = parseInt(match[0], 10);
    if (Number.isNaN(n)) return undefined;
    return Math.max(1, n);
  };

  const handleDrugSelect = (drug: DrugSearchResult) => {
    const updates = {
      name: drug.openfda?.generic_name || drug.openfda?.brand_name || value.name,
      ndc: drug.product_ndc || value.ndc,
      strength: drug.strength || value.strength,
      dosageForm: drug.openfda?.dosage_form || value.dosageForm,
      route: drug.openfda?.route || value.route,
    };
    onChange({ ...value, ...updates });
    setShowSearch(false);
  };

  const updateField = (field: string, val: any) => {
    onChange({ ...value, [field]: val });
  };

  // Danh sách gợi ý cho các trường
  const strengthSuggestions = [
    '250mg', '500mg', '750mg', '1000mg', '125mg', '200mg', '300mg', '400mg', '600mg', '800mg',
    '100mg/5ml', '200mg/5ml', '250mg/5ml', '500mg/5ml', '10mg', '20mg', '40mg', '80mg', '160mg', '320mg',
    '5mg', '15mg', '30mg', '60mg', '120mg', '240mg'
  ];

  const dosageFormSuggestions = [
    'Viên nén', 'Viên nang', 'Viên sủi', 'Viên bao phim', 'Viên bao đường', 'Viên ngậm',
    'Sirô', 'Hỗn dịch', 'Dung dịch', 'Thuốc tiêm', 'Thuốc nhỏ mắt', 'Thuốc nhỏ tai', 'Thuốc nhỏ mũi',
    'Kem bôi', 'Gel bôi', 'Thuốc mỡ', 'Bột', 'Cao', 'Miếng dán', 'Thuốc đặt', 'Bình xịt', 'Ống hít'
  ];

  const routeSuggestions = [
    'Uống', 'Tiêm tĩnh mạch', 'Tiêm bắp', 'Tiêm dưới da', 'Tiêm trong da',
    'Nhỏ mắt', 'Nhỏ tai', 'Nhỏ mũi', 'Bôi ngoài da', 'Đặt hậu môn', 'Đặt âm đạo',
    'Hít', 'Xịt', 'Ngậm', 'Súc miệng', 'Thụt rửa', 'Truyền tĩnh mạch', 'Truyền dưới da'
  ];

  const doseUnitSuggestions = [
    'viên', 'viên nén', 'viên nang', 'viên sủi', 'gói', 'ml', 'lít', 'mg', 'g', 'mcg', 'UI', 'đơn vị', 'giọt', 'lần', 'liều'
  ];

  const frequencySuggestions = [
    '1 lần/ngày', '2 lần/ngày', '3 lần/ngày', '4 lần/ngày', '5 lần/ngày', '6 lần/ngày',
    'Mỗi 4 giờ', 'Mỗi 6 giờ', 'Mỗi 8 giờ', 'Mỗi 12 giờ', 'Khi cần', 'Trước khi ngủ', 'Sáng và tối',
    'Trước ăn', 'Sau ăn', 'Trong bữa ăn', 'Trước ăn 30 phút', 'Sau ăn 30 phút',
    'Khi đau', 'Khi sốt', 'Khi ho', 'Khi khó thở', 'Hàng tuần', '2 lần/tuần', '3 lần/tuần', 'Hàng tháng', 'Theo chỉ định'
  ];

  const durationSuggestions = [
    '1 ngày', '3 ngày', '5 ngày', '7 ngày (1 tuần)', '10 ngày', '14 ngày (2 tuần)', '21 ngày (3 tuần)',
    '28 ngày (4 tuần)', '30 ngày (1 tháng)', '45 ngày', '60 ngày (2 tháng)', '90 ngày (3 tháng)',
    '180 ngày (6 tháng)', '365 ngày (1 năm)', 'Theo chỉ định', 'Dài hạn', 'Vĩnh viễn'
  ];

  const quantityUnitSuggestions = [
    'viên', 'viên nén', 'viên nang', 'viên sủi', 'gói', 'chai', 'lọ', 'tuýp', 'ống', 'hộp', 'vỉ',
    'ml', 'lít', 'g', 'kg', 'mg', 'mcg', 'UI', 'đơn vị', 'giọt', 'liều', 'miếng', 'túi', 'viên ngậm', 'bình xịt', 'ống hít'
  ];

  const instructionsSuggestions = [
    'Uống sau khi ăn', 'Uống trước khi ăn', 'Uống trong bữa ăn', 'Uống khi đói', 'Không uống khi đói',
    'Uống nhiều nước', 'Uống ít nước', 'Không nhai, nuốt nguyên viên', 'Có thể nhai', 'Hòa tan trong nước',
    'Ngậm dưới lưỡi', 'Ngậm trong miệng', 'Súc miệng sau khi dùng', 'Không ăn uống sau 30 phút',
    'Tránh ánh sáng mặt trời', 'Bảo quản trong tủ lạnh', 'Bảo quản ở nhiệt độ phòng', 'Lắc đều trước khi dùng', 'Không lắc',
    'Bôi mỏng, không xoa mạnh', 'Tránh tiếp xúc với mắt', 'Rửa tay sau khi sử dụng', 'Không dùng chung với người khác',
    'Ngừng sử dụng nếu có phản ứng phụ', 'Theo chỉ định của bác sĩ', 'Không tự ý tăng liều', 'Uống đủ liệu trình', 'Không bỏ dở giữa chừng'
  ];

  return (
    <Card className="border-l-4shadow-sm hover:shadow-md transition-shadow">
      <CardContent >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-lg">Thuốc</h4>
              {value.name && (
                <Badge variant="secondary" className="text-xs mt-1 ">
                  {value.name}
                </Badge>
              )}
            </div>
          </div>
          {showRemove && onRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              Xóa
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Drug Search & Name */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">Tên thuốc *</Label>
              <Dialog open={showSearch} onOpenChange={setShowSearch}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3 bg-white">
                    <Search className="h-4 w-4 mr-2" />
                    Tìm kiếm
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[80vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Search className="h-6 w-6 text-blue-500" />
                      </div>
                      Tìm kiếm thuốc từ OpenFDA
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <DrugSearch onSelectDrug={handleDrugSelect} showSelectButton={true} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Input
              value={value.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nhập tên thuốc hoặc tìm kiếm..."
              className="w-full bg-white"
            />
          </div>

          {/* Basic Info Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Liều lượng</Label>
              <InputWithSuggestions
                value={value.strength || ''}
                onChange={(val) => updateField('strength', val)}
                suggestions={strengthSuggestions}
                placeholder="Nhập liều lượng (vd: 500mg)"
                className="text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Dạng bào chế</Label>
              <InputWithSuggestions
                value={value.dosageForm || ''}
                onChange={(val) => updateField('dosageForm', val)}
                suggestions={dosageFormSuggestions}
                placeholder="Nhập dạng bào chế (vd: Viên nén)"
                className="text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Đường dùng</Label>
              <InputWithSuggestions
                value={value.route || ''}
                onChange={(val) => updateField('route', val)}
                suggestions={routeSuggestions}
                placeholder="Nhập đường dùng (vd: Uống)"
                className="text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Dosage Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Liều dùng</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={value.dose || ''}
                  onChange={(e) => updateField('dose', Number(e.target.value))}
                  placeholder="1"
                  className="flex-1 text-sm border-gray-300 focus:border-blue-500"
                />
                <InputWithSuggestions
                  value={value.doseUnit || ''}
                  onChange={(val) => updateField('doseUnit', val)}
                  suggestions={doseUnitSuggestions}
                  placeholder="ĐV"
                  className="w-24 text-sm border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Tần suất</Label>
              <InputWithSuggestions
                value={value.frequency || ''}
                onChange={(val) => updateField('frequency', val)}
                suggestions={frequencySuggestions}
                placeholder="Nhập tần suất (vd: 2 lần/ngày)"
                className="text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Thời gian</Label>
              <InputWithSuggestions
              value={value.durationDays?.toString() || ''}
              onChange={(val) => updateField('durationDays', parseDurationDays(val))}
                suggestions={durationSuggestions}
                placeholder="Nhập thời gian (vd: 7 ngày)"
                className="text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quantity & NDC */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Số lượng</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={value.quantity || ''}
                  onChange={(e) => updateField('quantity', Number(e.target.value))}
                  placeholder="10"
                  className="flex-1 text-sm border-gray-300 focus:border-blue-500"
                />
                <InputWithSuggestions
                  value={value.quantityUnit || ''}
                  onChange={(val) => updateField('quantityUnit', val)}
                  suggestions={quantityUnitSuggestions}
                  placeholder="ĐV"
                  className="w-24 text-sm border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">NDC (tùy chọn)</Label>
              <Input
                value={value.ndc || ''}
                onChange={(e) => updateField('ndc', e.target.value)}
                placeholder="Mã NDC"
                className="text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Hướng dẫn sử dụng</Label>
            <InputWithSuggestions
              value={value.instructions || ''}
              onChange={(val) => updateField('instructions', val)}
              suggestions={instructionsSuggestions}
              placeholder="Nhập hướng dẫn sử dụng (vd: Uống sau khi ăn)"
              className="text-sm border-gray-300 focus:border-blue-500 bg-white"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
