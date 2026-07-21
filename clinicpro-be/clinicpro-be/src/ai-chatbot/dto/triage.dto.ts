/**
 * DTO cho yêu cầu Phân luồng y tế (AI Triage).
 * Sử dụng trên Kiosk khi bệnh nhân nhập triệu chứng.
 */
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class TriageRequestDto {
  /** Mô tả triệu chứng của bệnh nhân (tối đa 1000 ký tự) */
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập triệu chứng' })
  @MaxLength(1000, { message: 'Triệu chứng không được vượt quá 1000 ký tự' })
  symptoms: string;
}

/**
 * DTO cho kết quả Phân luồng y tế.
 * Luôn chứa đúng 1 chuyên khoa được gợi ý và lý do.
 */
export class TriageResponseDto {
  /** Tên chuyên khoa được gợi ý (VD: "Nội thần kinh") */
  suggestedSpecialty: string;

  /** Lý do gợi ý (ngắn gọn, dưới 30 từ) */
  reasoning: string;
}
