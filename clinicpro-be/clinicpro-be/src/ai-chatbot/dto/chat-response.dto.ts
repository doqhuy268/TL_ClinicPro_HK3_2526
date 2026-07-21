/**
 * DTO cho phản hồi từ AI Chatbot.
 */

/** Dữ liệu hệ thống đính kèm (khi AI truy vấn CSDL để trả lời) */
export class SystemDataDto {
  /** Câu truy vấn Prisma đã thực thi */
  query?: string;
  /** Dữ liệu trả về từ CSDL */
  data?: unknown;
}

/** Phản hồi chính từ AI Chatbot */
export class ChatResponseDto {
  /** Nội dung trả lời từ AI */
  response: string;

  /** Mã cuộc hội thoại (dùng để duy trì context) */
  conversationId: string;

  /** Thời điểm phản hồi */
  timestamp: Date;

  /** Có phải lời khuyên y tế không (để hiển thị disclaimer) */
  isMedicalAdvice: boolean;

  /** Câu miễn trừ trách nhiệm y tế (chỉ có khi isMedicalAdvice = true) */
  disclaimer?: string;

  /** Dữ liệu hệ thống đính kèm (chỉ có khi AI truy vấn CSDL) */
  systemData?: SystemDataDto;
}

/** DTO lỗi (dùng cho các trường hợp xử lý lỗi tùy chỉnh) */
export class ChatErrorDto {
  error: string;
  message: string;
  timestamp: Date;
}
