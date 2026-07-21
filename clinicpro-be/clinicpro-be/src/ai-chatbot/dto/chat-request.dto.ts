/**
 * DTO cho yêu cầu Chat với AI.
 * Sử dụng cho chức năng Chatbot tư vấn y tế trên Web/Kiosk.
 */
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ChatRequestDto {
  /** Nội dung tin nhắn từ người dùng (tối đa 2000 ký tự) */
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung tin nhắn' })
  @MaxLength(2000, { message: 'Tin nhắn không được vượt quá 2000 ký tự' })
  message: string;

  /** Mã cuộc hội thoại (tự tạo nếu không truyền) */
  @IsOptional()
  @IsString()
  conversationId?: string;

  /** ID người dùng (tùy chọn, dùng để tracking) */
  @IsOptional()
  @IsString()
  userId?: string;
}
