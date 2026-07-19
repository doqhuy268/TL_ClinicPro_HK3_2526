/**
 * ======================================================================
 *  AI CHATBOT SERVICE
 *  Xử lý nghiệp vụ chính của module Chatbot AI y tế.
 * ======================================================================
 *
 *  Service này cung cấp 2 chức năng chính:
 *
 *  1. generateResponse()  → Chatbot tư vấn y tế + tra cứu dữ liệu CSDL
 *  2. getHealthTips()     → Lời khuyên sức khỏe theo chủ đề
 *
 *  Mô hình AI sử dụng: Google Gemini 2.5 Flash
 *  Cơ chế an toàn: Safety Settings chặn nội dung độc hại
 * ======================================================================
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { ChatRequestDto, ChatResponseDto } from './dto';
import { DatabaseQueryService } from './database-query.service';

// Import các hàm tiện ích đã tách riêng
import {
  containsMedicalAdvice,
  generateConversationId,
  buildMedicalAssistantPrompt,
  MEDICAL_DISCLAIMER,
} from './ai-chatbot.utils';

@Injectable()
export class AiChatbotService {
  private readonly logger = new Logger(AiChatbotService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    private configService: ConfigService,
    private databaseQueryService: DatabaseQueryService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    // Nếu thiếu API Key, service vẫn hoạt động nhưng tính năng AI sẽ bị vô hiệu hóa
    // (Graceful Degradation — hệ thống không crash)
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY chưa cấu hình. Chatbot AI sẽ bị vô hiệu hóa.',
      );
      return;
    }

    // Khởi tạo Google Gemini AI với cấu hình an toàn
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  // ────────────────────────────────────────────────────────────
  //  CHỨC NĂNG 1: CHATBOT TƯ VẤN Y TẾ
  //  Xử lý 2 loại câu hỏi:
  //    a) Câu hỏi về dữ liệu hệ thống → Truy vấn CSDL
  //    b) Câu hỏi về sức khỏe          → AI trả lời trực tiếp
  // ────────────────────────────────────────────────────────────
  async generateResponse(
    chatRequest: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    try {
      // Bước 1: Kiểm tra xem câu hỏi có liên quan đến dữ liệu CSDL không
      // Ví dụ: "Phòng khám có bao nhiêu bác sĩ?" → Truy vấn DB
      const databaseQuery =
        await this.databaseQueryService.processDatabaseQuery(
          chatRequest.message,
        );

      let text: string;
      let isMedicalAdvice = false;
      let systemData: { query: string; data: unknown } | undefined;

      if (databaseQuery.success) {
        // ── Nhánh A: Trả lời bằng dữ liệu từ CSDL ──
        text = databaseQuery.explanation || 'Đây là thông tin từ hệ thống.';
        systemData = {
          query: databaseQuery.query ?? '',
          data: databaseQuery.data,
        };
      } else {
        // ── Nhánh B: AI trả lời trực tiếp (tư vấn y tế) ──
        const prompt = buildMedicalAssistantPrompt(chatRequest.message);
        const result = await this.model.generateContent(prompt);
        text = result.response.text();
        isMedicalAdvice = containsMedicalAdvice(text);
      }

      // Bước 2: Tạo mã cuộc hội thoại (nếu chưa có)
      const conversationId =
        chatRequest.conversationId || generateConversationId();

      // Bước 3: Trả về kết quả kèm disclaimer nếu là lời khuyên y tế
      return {
        response: text,
        conversationId,
        timestamp: new Date(),
        isMedicalAdvice,
        disclaimer: isMedicalAdvice ? MEDICAL_DISCLAIMER : undefined,
        systemData,
      };
    } catch (error) {
      this.logger.error('Lỗi khi tạo phản hồi AI:', error);
      throw new BadRequestException('Không thể tạo phản hồi từ AI');
    }
  }

  // ────────────────────────────────────────────────────────────
  //  CHỨC NĂNG PHỤ: LỜI KHUYÊN SỨC KHỎE THEO CHỦ ĐỀ
  //
  //  Hỗ trợ 5 chủ đề: general, nutrition, exercise, mental, prevention
  //  Sử dụng lại generateResponse() để AI trả lời tự nhiên
  // ────────────────────────────────────────────────────────────
  async getHealthTips(category?: string): Promise<ChatResponseDto> {
    const categoryPrompts: Record<string, string> = {
      general: 'Cung cấp 5 lời khuyên sức khỏe tổng quát',
      nutrition: 'Cung cấp 5 lời khuyên về dinh dưỡng và ăn uống lành mạnh',
      exercise: 'Cung cấp 5 lời khuyên về tập thể dục và vận động',
      mental: 'Cung cấp 5 lời khuyên về sức khỏe tinh thần',
      prevention: 'Cung cấp 5 lời khuyên về phòng ngừa bệnh tật',
    };

    const prompt = category
      ? categoryPrompts[category] || categoryPrompts.general
      : categoryPrompts.general;

    return this.generateResponse({
      message: prompt,
      conversationId: `tips_${category || 'general'}_${Date.now()}`,
    });
  }

  // ────────────────────────────────────────────────────────────
  //  CHỨC NĂNG 3: AI TRIAGE — GỢI Ý CHUYÊN KHOA
  //  Dùng cho Kiosk: bệnh nhân mô tả triệu chứng → AI gợi ý
  //  chuyên khoa phù hợp để bốc số đúng
  // ────────────────────────────────────────────────────────────
  async triageSymptoms(
    symptoms: string,
  ): Promise<{ suggestedSpecialty: string; reasoning: string }> {
    if (!this.model) {
      throw new BadRequestException('AI service chưa được cấu hình');
    }

    const prompt = `Bạn là trợ lý phân luồng bệnh nhân tại Phòng khám Đa khoa ClinicPro.

ClinicPro có các chuyên khoa sau: Nội tổng quát, Nhi khoa, Sản Phụ khoa, Tai Mũi Họng, Răng Hàm Mặt, Da liễu, Mắt, Tim mạch, Tiêu hóa, Thần kinh, Cơ xương khớp, Dinh dưỡng, Tâm lý, Y học cổ truyền, Ung bướu, Hô hấp, Tiết niệu, Nội tiết, Vật lý trị liệu.

Dựa vào triệu chứng bệnh nhân mô tả, hãy gợi ý MỘT chuyên khoa phù hợp nhất.

QUAN TRỌNG: Bạn PHẢI trả lời ĐÚNG định dạng JSON sau, không thêm bất kỳ text nào khác:
{"suggestedSpecialty": "Tên chuyên khoa", "reasoning": "Lý do ngắn gọn bằng tiếng Việt (1-2 câu)"}

Triệu chứng bệnh nhân mô tả: ${symptoms}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      // Parse JSON từ response
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        suggestedSpecialty: parsed.suggestedSpecialty || 'Nội tổng quát',
        reasoning: parsed.reasoning || 'Vui lòng đến quầy lễ tân để được tư vấn thêm.',
      };
    } catch (error) {
      this.logger.error('Lỗi AI Triage:', error);
      return {
        suggestedSpecialty: 'Nội tổng quát',
        reasoning: 'Hệ thống AI chưa thể phân tích. Vui lòng đến quầy lễ tân để được tư vấn trực tiếp.',
      };
    }
  }
}

