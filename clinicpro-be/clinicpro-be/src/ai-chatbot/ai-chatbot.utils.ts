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
//  DANH SÁCH CHUYÊN KHOA HỢP LỆ
//  Dùng để validate kết quả phân luồng từ AI
// ──────────────────────────────────────────────────────────────
export const VALID_SPECIALTIES = [
  'Nội tổng quát',
  'Nội tim mạch',
  'Nội tiêu hóa',
  'Nội thần kinh',
  'Ngoại khoa',
  'Tai Mũi Họng',
  'Răng Hàm Mặt',
  'Mắt',
  'Da liễu',
  'Sản phụ khoa',
  'Nhi khoa',
] as const;

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
//
//  @param text  - Nội dung trả lời từ AI
//  @returns     - true nếu phát hiện từ khóa y tế
// ──────────────────────────────────────────────────────────────
export function containsMedicalAdvice(text: string): boolean {
  const lowerText = text.toLowerCase();
  return MEDICAL_KEYWORDS.some((keyword) => lowerText.includes(keyword));
}

// ──────────────────────────────────────────────────────────────
//  generateConversationId()
//  Tạo mã định danh duy nhất cho mỗi cuộc hội thoại.
//  Format: conv_{timestamp}_{random9chars}
//
//  Ví dụ: conv_1716123456789_a3f8k2m7q
// ──────────────────────────────────────────────────────────────
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ──────────────────────────────────────────────────────────────
//  parseTriageJSON()
//  Trích xuất JSON từ phản hồi của AI (có thể bọc trong markdown).
//
//  AI đôi khi trả về JSON bọc trong ```json ... ``` thay vì JSON thuần.
//  Hàm này xử lý mọi trường hợp và trả về object an toàn.
//
//  @param rawText  - Chuỗi text thô từ Gemini API
//  @returns        - Object { suggestedSpecialty, reasoning } đã parse
// ──────────────────────────────────────────────────────────────
export function parseTriageJSON(rawText: string): {
  suggestedSpecialty: string;
  reasoning: string;
} {
  // Giá trị mặc định an toàn khi không parse được
  const fallback = {
    suggestedSpecialty: 'Nội tổng quát',
    reasoning:
      'Không thể phân tích chính xác, vui lòng khám nội tổng quát để bác sĩ tư vấn thêm.',
  };

  try {
    // Bước 1: Loại bỏ markdown code fence nếu có
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```/g, '').trim();
    }

    // Bước 2: Parse JSON
    const parsed = JSON.parse(jsonStr);

    // Bước 3: Validate cấu trúc — phải có đủ 2 field bắt buộc
    if (
      typeof parsed.suggestedSpecialty !== 'string' ||
      typeof parsed.reasoning !== 'string'
    ) {
      return fallback;
    }

    return {
      suggestedSpecialty: parsed.suggestedSpecialty,
      reasoning: parsed.reasoning,
    };
  } catch {
    return fallback;
  }
}

// ──────────────────────────────────────────────────────────────
//  normalizeGender()
//  Chuẩn hóa giới tính từ nhiều định dạng đầu vào khác nhau
//  thành mã 1 ký tự: 'M' (Nam), 'F' (Nữ), 'O' (Khác).
//
//  Hỗ trợ cả tiếng Việt: "nam", "nữ", "nu"
//  Hỗ trợ cả tiếng Anh: "male", "female", "m", "f"
//
//  @param input  - Chuỗi giới tính bất kỳ
//  @returns      - 'M' | 'F' | 'O'
// ──────────────────────────────────────────────────────────────
export function normalizeGender(input: string): 'M' | 'F' | 'O' {
  const raw = (input || '').toString().toLowerCase().trim();
  if (['male', 'nam', 'm'].includes(raw)) return 'M';
  if (['female', 'nữ', 'nu', 'f'].includes(raw)) return 'F';
  return 'O';
}

// ──────────────────────────────────────────────────────────────
//  PROMPT TEMPLATES
//  Các mẫu prompt dùng để giao tiếp với Google Gemini AI.
//  Tách riêng để dễ chỉnh sửa mà không chạm vào logic nghiệp vụ.
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

/**
 * buildTriagePrompt()
 * Tạo prompt cho chức năng Phân luồng y tế (AI Triage).
 *
 * Đây là tính năng cốt lõi của đề tài. Prompt này bắt buộc AI:
 * - Chỉ đưa ra ĐÚNG 1 chuyên khoa phù hợp nhất
 * - Trả về ĐÚNG định dạng JSON (để máy đọc được)
 * - Giải thích ngắn gọn dưới 30 từ
 */
export function buildTriagePrompt(symptoms: string): string {
  return `Bạn là một chuyên gia phân luồng y tế (Triage Expert) tại phòng khám đa khoa.
Nhiệm vụ của bạn là đọc triệu chứng của bệnh nhân và chỉ đưa ra ĐÚNG 1 chuyên khoa phù hợp nhất để bệnh nhân đăng ký khám, kèm theo 1-2 câu giải thích lướt qua.

Các chuyên khoa thường có tại phòng khám: ${VALID_SPECIALTIES.join(', ')}.

Triệu chứng của bệnh nhân: "${symptoms}"

Cấu trúc câu trả lời BẮT BUỘC theo định dạng JSON như sau (không được giải nghĩa thêm hay viết thêm text ở ngoài chuỗi JSON):
{
  "suggestedSpecialty": "Tên chuyên khoa",
  "reasoning": "Lý do ngắn gọn dưới 30 từ"
}`;
}
