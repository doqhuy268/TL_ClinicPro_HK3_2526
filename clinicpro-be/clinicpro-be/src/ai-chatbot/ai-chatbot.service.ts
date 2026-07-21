/**
 * ======================================================================
 *  AI CHATBOT SERVICE
 *  Xử lý nghiệp vụ chính của module Chatbot AI y tế.
 * ======================================================================
 *
 *  Service này cung cấp 3 chức năng chính:
 *
 *  1. generateResponse()  → Chatbot tư vấn y tế + tra cứu dữ liệu CSDL
 *  2. triageSymptoms()    → Phân luồng bệnh nhân (AI Triage) — CORE
 *  3. suggestDiagnosis()  → Gợi ý chẩn đoán (gọi Python microservice)
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
import axios from 'axios';
import { ChatRequestDto, ChatResponseDto } from './dto';
import {
  SuggestDiagnosisRequestDto,
  SuggestDiagnosisResponseDto,
} from './dto/suggest-diagnosis.dto';
import { TriageRequestDto, TriageResponseDto } from './dto/triage.dto';
import { DatabaseQueryService } from './database-query.service';

// Import các hàm tiện ích đã tách riêng
import {
  containsMedicalAdvice,
  generateConversationId,
  parseTriageJSON,
  normalizeGender,
  buildMedicalAssistantPrompt,
  buildTriagePrompt,
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
  //  CHỨC NĂNG 2: PHÂN LUỒNG Y TẾ (AI TRIAGE) — TÍNH NĂNG CỐT LÕI
  //
  //  Luồng xử lý:
  //    Bệnh nhân nhập triệu chứng → AI phân tích → Trả về chuyên khoa
  //
  //  Ví dụ:
  //    Input:  "Tôi bị đau đầu, chóng mặt, buồn nôn"
  //    Output: { suggestedSpecialty: "Nội thần kinh",
  //              reasoning: "Các triệu chứng gợi ý vấn đề thần kinh" }
  //
  //  Cơ chế an toàn:
  //    - Nếu AI trả về JSON không hợp lệ → Mặc định "Nội tổng quát"
  //    - Nếu AI model chưa cấu hình     → Throw lỗi rõ ràng
  // ────────────────────────────────────────────────────────────
  async triageSymptoms(dto: TriageRequestDto): Promise<TriageResponseDto> {
    // Kiểm tra AI model đã sẵn sàng chưa
    if (!this.model) {
      throw new BadRequestException(
        'AI Model chưa được cấu hình. Vui lòng kiểm tra GEMINI_API_KEY.',
      );
    }

    try {
      // Bước 1: Tạo prompt chuyên dụng cho Triage
      const prompt = buildTriagePrompt(dto.symptoms);

      // Bước 2: Gửi prompt đến Google Gemini và nhận phản hồi
      const result = await this.model.generateContent(prompt);
      const rawText = result.response.text();

      // Bước 3: Parse JSON từ phản hồi (có xử lý markdown fence)
      const parsed = parseTriageJSON(rawText);

      this.logger.log(
        `Triage thành công: "${dto.symptoms.substring(0, 30)}..." → ${parsed.suggestedSpecialty}`,
      );

      return parsed;
    } catch (error) {
      this.logger.error('Lỗi khi phân luồng y tế:', error);
      throw new BadRequestException('Không thể thực hiện phân luồng y tế');
    }
  }

  // ────────────────────────────────────────────────────────────
  //  CHỨC NĂNG 3: GỢI Ý CHẨN ĐOÁN (GỌI PYTHON MICROSERVICE)
  //
  //  Hàm này gọi đến FastAPI service (RECOMMENDER_BASE_URL/predict)
  //  để nhận gợi ý chẩn đoán dựa trên tuổi, giới tính, và ghi chú.
  //
  //  Lưu ý: Tính năng này KHÔNG thuộc phạm vi đề tài chính
  //  (đề tài tập trung vào Chatbot AI y tế và Kiosk).
  //  Nếu chưa cấu hình URL → Trả về danh sách rỗng (không crash).
  // ────────────────────────────────────────────────────────────
  async suggestDiagnosis(
    dto: SuggestDiagnosisRequestDto,
  ): Promise<SuggestDiagnosisResponseDto> {
    const baseUrl = this.configService.get<string>('RECOMMENDER_BASE_URL');

    // Nếu chưa cấu hình URL service → Trả về rỗng (Graceful Degradation)
    if (!baseUrl?.trim()) {
      this.logger.warn(
        'RECOMMENDER_BASE_URL chưa cấu hình. Trả về danh sách gợi ý rỗng.',
      );
      return {
        predictions: [],
        patient_info: { age: dto.age, gender: dto.gender, notes: dto.note },
      };
    }

    // Chuẩn hóa giới tính đầu vào (hỗ trợ cả tiếng Việt lẫn tiếng Anh)
    const gender = normalizeGender(dto.gender);
    const topK = dto.topK ?? 10;

    try {
      // Gọi FastAPI service
      const { data } = await axios.post(
        `${baseUrl.replace(/\/$/, '')}/predict`,
        { age: dto.age, gender, notes: dto.note },
        { headers: { 'Content-Type': 'application/json' }, timeout: 20000 },
      );

      // Xử lý kết quả: sắp xếp theo xác suất giảm dần, giới hạn topK
      const predictions = Array.isArray(data?.predictions)
        ? (data.predictions as Array<{
            icd_code?: string;
            probability: number;
            disease_name: string;
          }>)
        : [];

      const sorted = predictions
        .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
        .slice(0, topK)
        .map((p) => ({
          icd_code: p.icd_code,
          probability: p.probability,
          disease_name: p.disease_name ?? '',
        }));

      return {
        predictions: sorted,
        patient_info: { age: dto.age, gender: dto.gender, notes: dto.note },
      };
    } catch (err) {
      this.logger.warn(
        'Gọi service gợi ý chẩn đoán thất bại:',
        (err as Error).message,
      );
      // Trả về rỗng thay vì crash → Graceful Degradation
      return {
        predictions: [],
        patient_info: { age: dto.age, gender: dto.gender, notes: dto.note },
      };
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
}
