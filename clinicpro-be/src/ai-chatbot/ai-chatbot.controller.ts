import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AiChatbotService } from './ai-chatbot.service';
import { DatabaseQueryService } from './database-query.service';
import { ChatRequestDto, ChatResponseDto } from './dto';
import { JwtAuthGuard } from '../login/jwt-auth.guard';
import { Public } from '../rbac/public.decorator';

/**
 * Controller quản lý các endpoint của Chatbot AI y tế.
 * 
 * Các endpoint chính:
 * - POST /ai-chatbot/chat    → Chatbot tư vấn sức khỏe (Yêu cầu đăng nhập)
 * - GET  /ai-chatbot/health-tips → Lời khuyên sức khỏe theo chủ đề
 * - GET  /ai-chatbot/status   → Kiểm tra trạng thái service
 */
@Controller('ai-chatbot')
@UseGuards(JwtAuthGuard)
export class AiChatbotController {
  private readonly logger = new Logger(AiChatbotController.name);

  constructor(
    private readonly aiChatbotService: AiChatbotService,
    private readonly databaseQueryService: DatabaseQueryService,
  ) {}

  /**
   * [CORE] Chatbot tư vấn y tế — Trả lời câu hỏi sức khỏe + tra cứu CSDL.
   * Yêu cầu đăng nhập (JWT) để xác định role và scope dữ liệu.
   */
  @Post('chat')
  @Public()
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    this.logger.log(`Chat: "${dto.message.substring(0, 50)}..."`);
    return this.aiChatbotService.generateResponse(dto);
  }

  /**
   * Lời khuyên sức khỏe theo chủ đề (general, nutrition, exercise, mental, prevention).
   */
  @Get('health-tips')
  @HttpCode(HttpStatus.OK)
  async getHealthTips(@Query('category') category?: string): Promise<ChatResponseDto> {
    this.logger.log(`Health tips: ${category || 'general'}`);
    return this.aiChatbotService.getHealthTips(category);
  }

  /**
   * Thống kê hệ thống (dùng cho Chatbot khi được hỏi về dữ liệu).
   */
  @Get('system-stats')
  @HttpCode(HttpStatus.OK)
  async getSystemStats(): Promise<any> {
    return this.databaseQueryService.getSystemStats();
  }

  /**
   * Tìm kiếm bác sĩ theo tên (dùng cho Chatbot trả lời câu hỏi).
   */
  @Get('search-doctors')
  @HttpCode(HttpStatus.OK)
  async searchDoctors(@Query('q') searchTerm: string): Promise<any[]> {
    return this.databaseQueryService.searchDoctors(searchTerm);
  }

  /**
   * Kiểm tra trạng thái hoạt động của AI Chatbot service.
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  getStatus(): { status: string; timestamp: Date } {
    return {
      status: 'AI Chatbot service is running',
      timestamp: new Date(),
    };
  }

  /**
   * [Kiosk] AI Triage — Gợi ý chuyên khoa dựa trên triệu chứng.
   * Public endpoint, dùng cho màn hình Kiosk.
   */
  @Post('triage')
  @Public()
  @HttpCode(HttpStatus.OK)
  async triage(@Body('symptoms') symptoms: string): Promise<{ suggestedSpecialty: string; reasoning: string }> {
    this.logger.log(`Triage: "${symptoms?.substring(0, 50)}..."`);
    return this.aiChatbotService.triageSymptoms(symptoms);
  }
}
