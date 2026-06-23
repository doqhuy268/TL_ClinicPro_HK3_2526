import {
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkSessionDto {
  @IsDateString()
  startTime: string; // ISO string format (VD: 2025-02-25T08:00:00.000Z)

  @IsDateString()
  endTime: string; // ISO string format

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần chọn ít nhất 1 dịch vụ' })
  @IsString({ each: true })
  serviceIds: string[]; // Danh sách service IDs (bắt buộc để tự động phân phòng)
}

export class CreateWorkSessionsDto {
  /** Chỉ dùng khi ADMIN tạo lịch thay cho Doctor/Technician. authId của user đích. */
  @IsOptional()
  @IsString()
  userId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần thêm ít nhất 1 ca làm việc' })
  @ValidateNested({ each: true })
  @Type(() => CreateWorkSessionDto)
  workSessions: CreateWorkSessionDto[];
}

