import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class SuggestDiagnosisRequestDto {
  @IsNumber()
  @Min(0)
  @Max(150)
  age: number;

  @IsString()
  gender: string; // M / F / O hoặc nam / nữ / khác

  @IsString()
  note: string; // Ghi chú bệnh án / tóm tắt lâm sàng

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number; // Số lượng gợi ý trả về, mặc định 10
}

export interface SuggestDiagnosisItemDto {
  icd_code?: string;
  probability: number;
  disease_name: string;
  disease_name_vi?: string;
}

export class SuggestDiagnosisResponseDto {
  predictions: SuggestDiagnosisItemDto[];
  patient_info?: { age: number; gender: string; notes: string };
}
