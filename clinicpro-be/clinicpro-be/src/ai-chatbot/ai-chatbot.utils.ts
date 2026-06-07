/**
 * ======================================================================
 *  AI CHATBOT UTILITIES
 *  Các hàm tiện ích dùng chung cho module AI Chatbot.
 * ======================================================================
 *
 *  File này chứa các hàm thuần (pure functions) không phụ thuộc vào
 *  DI Container, giúp tách biệt logic xử lý khỏi service chính.
 * ======================================================================
 */

// ──────────────────────────────────────────────────────────────
//  TỪ KHÓA Y TẾ
//  Dùng để phát hiện nội dung liên quan đến y tế trong câu trả lời AI
// ──────────────────────────────────────────────────────────────
const MEDICAL_KEYWORDS = [
  'bệnh',
  'triệu chứng',
  'điều trị',
  'thuốc',
  'bác sĩ',
  'khám',
  'chẩn đoán',
  'sức khỏe',
  'y tế',
  'phòng ngừa',
  'cách chữa',
  'dấu hiệu',
  'nguyên nhân',
] as const;

// ──────────────────────────────────────────────────────────────
//  CÂU MIỄN TRỪ TRÁCH NHIỆM Y TẾ
// ──────────────────────────────────────────────────────────────
export const MEDICAL_DISCLAIMER =
  '⚠️ Lưu ý: Thông tin này chỉ mang tính chất tham khảo và không thay thế cho việc tư vấn y tế chuyên nghiệp. Vui lòng tham khảo ý kiến bác sĩ cho các vấn đề sức khỏe cụ thể.';

// ──────────────────────────────────────────────────────────────
//  containsMedicalAdvice()
//  Kiểm tra xem nội dung trả lời có chứa lời khuyên y tế hay không.
//  Nếu có, hệ thống sẽ tự động gắn câu miễn trừ trách nhiệm.
// ──────────────────────────────────────────────────────────────
export function containsMedicalAdvice(text: string): boolean {
  const lowerText = text.toLowerCase();
  return MEDICAL_KEYWORDS.some((keyword) => lowerText.includes(keyword));
}

// ──────────────────────────────────────────────────────────────
//  generateConversationId()
//  Tạo mã định danh duy nhất cho mỗi cuộc hội thoại.
//  Format: conv_{timestamp}_{random9chars}
// ──────────────────────────────────────────────────────────────
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ──────────────────────────────────────────────────────────────
//  PROMPT TEMPLATES
// ──────────────────────────────────────────────────────────────

/**
 * buildMedicalAssistantPrompt()
 * Tạo prompt cho chức năng Chatbot tư vấn y tế.
 *
 * Prompt này ràng buộc AI:
 * - KHÔNG được chẩn đoán bệnh cụ thể
 * - KHÔNG được thay thế bác sĩ
 * - Luôn khuyến khích bệnh nhân gặp bác sĩ
 * - Trả lời ngắn gọn, bằng tiếng Việt
 */
export function buildMedicalAssistantPrompt(userMessage: string): string {
  return `Bạn là một trợ lý y tế AI thông minh và có kinh nghiệm. Nhiệm vụ của bạn là:

1. Trả lời các câu hỏi liên quan đến sức khỏe và y tế một cách chính xác và hữu ích
2. Cung cấp thông tin giáo dục về sức khỏe, triệu chứng, và các vấn đề y tế phổ biến
3. Đưa ra lời khuyên chung về lối sống lành mạnh và phòng ngừa bệnh tật
4. Hướng dẫn người dùng khi nào cần tìm kiếm sự chăm sóc y tế chuyên nghiệp
5. Trả lời ngắn gọn khoảng một đoạn ngắn, nhưng vẫn đủ ý nghĩa

QUAN TRỌNG:
- Bạn KHÔNG được chẩn đoán bệnh cụ thể
- Bạn KHÔNG được thay thế cho bác sĩ hoặc chuyên gia y tế
- Luôn khuyến khích người dùng tham khảo ý kiến bác sĩ cho các vấn đề sức khỏe nghiêm trọng
- Sử dụng ngôn ngữ dễ hiểu và thân thiện
- Trả lời bằng tiếng Việt

Câu hỏi của người dùng: ${userMessage}

Hãy trả lời một cách hữu ích và an toàn:`;
}
