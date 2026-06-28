/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { WorkSessionService } from './work-session.service';
import {
  CreateWorkSessionsDto,
  UpdateWorkSessionDto,
  GetWorkSessionsBySpecialtyDto,
} from './dto';
import { JwtAuthGuard } from '../login/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import { Roles } from '../rbac/roles.decorator';
import { Role } from '../rbac/roles.enum';
import { WorkSessionStatus } from '@prisma/client';
import { getVnDayRangeUtc } from '../common/timezone';

@Controller('work-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkSessionController {
  constructor(private readonly workSessionService: WorkSessionService) {}

  /**
   * Tạo nhiều work sessions cùng lúc
   * DOCTOR và TECHNICIAN chỉ có thể tạo lịch cho chính mình
   * ADMIN có thể tạo lịch cho bất kỳ ai
   */
  @Post()
  @Roles(Role.DOCTOR, Role.TECHNICIAN, Role.ADMIN)
  async createWorkSessions(
    @Body() createWorkSessionsDto: CreateWorkSessionsDto,
    @Req() req: any,
  ) {
    const userRole = req.user?.role;
    let targetUserId = req.user?.id ?? req.user?.sub;
    let targetRole = userRole;

    // Validate user role
    if (
      userRole !== Role.DOCTOR &&
      userRole !== Role.TECHNICIAN &&
      userRole !== Role.ADMIN
    ) {
      throw new BadRequestException(
        'Only DOCTOR, TECHNICIAN, and ADMIN can create work sessions',
      );
    }

    // ADMIN: khi có userId trong body, tạo lịch thay cho Doctor/Technician đó
    if (userRole === Role.ADMIN && createWorkSessionsDto.userId) {
      targetUserId = createWorkSessionsDto.userId;
      targetRole = await this.workSessionService.resolveRoleFromAuthId(
        targetUserId,
      );
    } else if (userRole === Role.ADMIN) {
      throw new BadRequestException(
        'Admin cần chọn Bác sĩ hoặc Kỹ thuật viên để tạo lịch. Vui lòng chọn người trong danh sách trước khi tạo.',
      );
    }

    // Validate userId exists
    if (!targetUserId) {
      throw new BadRequestException('User ID not found in token');
    }

    return this.workSessionService.createWorkSessions(
      createWorkSessionsDto,
      targetUserId,
      targetRole,
    );
  }

  /**
   * Lấy work sessions của user hiện tại
   */
  @Get('my-schedule')
  @Roles(Role.DOCTOR, Role.TECHNICIAN)
  async getMyWorkSessions(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const authId = req.user?.sub;
    const userRole = req.user?.role;

    const userType = userRole === Role.DOCTOR ? 'DOCTOR' : 'TECHNICIAN';

    return this.workSessionService.getWorkSessionsByUser(
      authId,
      userType,
      startDate,
      endDate,
    );
  }

  /**
   * Lấy các phiên làm việc trong ngày hiện tại của user (APPROVED, IN_PROGRESS, COMPLETED)
   */
  @Get('today/my')
  @Roles(Role.DOCTOR, Role.TECHNICIAN)
  async getTodayMyWorkSessions(@Req() req: any) {
    const userRole = req.user?.role as Role;
    const authId = req.user?.sub as string;

    const userInfo = await this.workSessionService['getUserInfo'](
      authId,
      userRole,
    ); // reuse resolver
    const userType = userInfo.userType; // 'DOCTOR' | 'TECHNICIAN'

    return this.workSessionService.getTodayWorkSessionsByUser(
      userType,
      userInfo.id,
    );
  }

  /**
   * Lấy work sessions của một user cụ thể (chỉ ADMIN)
   */
  @Get('user/:userId')
  @Roles(Role.ADMIN)
  async getUserWorkSessions(
    @Param('userId') userId: string,
    @Query('userType') userType: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.workSessionService.getWorkSessionsByUser(
      userId,
      userType,
      startDate,
      endDate,
    );
  }

  /**
   * Lấy tất cả work sessions với filter (chỉ ADMIN)
   */
  @Get()
  @Roles(Role.ADMIN)
  async getAllWorkSessions(
    @Query('userType') userType?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: WorkSessionStatus,
  ) {
    return this.workSessionService.getAllWorkSessions(
      userType,
      userId,
      startDate,
      endDate,
      status,
    );
  }

  /**
   * Lấy work sessions theo chuyên khoa (chỉ ADMIN)
   */
  @Get('by-specialty')
  @Roles(Role.ADMIN)
  async getWorkSessionsBySpecialty(
    @Query() query: GetWorkSessionsBySpecialtyDto,
  ) {
    try {
      const result =
        await this.workSessionService.getWorkSessionsBySpecialty(query);
      return {
        success: true,
        message: 'Lấy danh sách work session theo chuyên khoa thành công',
        data: result,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(
        'Không thể lấy danh sách work session theo chuyên khoa',
      );
    }
  }

  /**
   * Lấy work session theo ID
   */
  @Get(':id')
  @Roles(Role.DOCTOR, Role.TECHNICIAN, Role.ADMIN)
  async getWorkSessionById(@Param('id') id: string, @Req() req: any) {
    const userRole = req.user?.role;
    const userId = req.user?.sub;

    // Tìm work session
    const workSessions = await this.workSessionService.getAllWorkSessions();
    const workSession = workSessions.find((ws) => ws.id === id);

    if (!workSession) {
      throw new BadRequestException('Work session not found');
    }

    // Nếu không phải ADMIN, chỉ có thể xem lịch của chính mình
    if (userRole !== Role.ADMIN) {
      const sessionUserId = workSession.doctorId || workSession.technicianId;
      if (sessionUserId !== userId) {
        throw new BadRequestException(
          'You can only view your own work sessions',
        );
      }
    }

    return workSession;
  }

  /**
   * Cập nhật work session
   */
  @Put(':id')
  @Roles(Role.DOCTOR, Role.TECHNICIAN, Role.ADMIN)
  async updateWorkSession(
    @Param('id') id: string,
    @Body() updateWorkSessionDto: UpdateWorkSessionDto,
    @Req() req: any,
  ) {
    const userRole = req.user?.role;
    const userId = req.user?.sub;

    // Nếu không phải ADMIN, chỉ có thể cập nhật lịch của chính mình
    if (userRole !== Role.ADMIN) {
      const workSessions = await this.workSessionService.getAllWorkSessions();
      const workSession = workSessions.find((ws) => ws.id === id);

      if (!workSession) {
        throw new BadRequestException('Work session not found');
      }

      const sessionUserId = workSession.doctorId || workSession.technicianId;
      if (sessionUserId !== userId) {
        throw new BadRequestException(
          'You can only update your own work sessions',
        );
      }
    }

    return this.workSessionService.updateWorkSession(
      id,
      updateWorkSessionDto,
      userRole,
    );
  }

  /**
   * Xóa work session
   */
  @Delete(':id')
  @Roles(Role.DOCTOR, Role.TECHNICIAN, Role.ADMIN)
  async deleteWorkSession(@Param('id') id: string, @Req() req: any) {
    const userRole = req.user?.role;
    const userId = req.user?.sub;

    // Nếu không phải ADMIN, chỉ có thể xóa lịch của chính mình
    if (userRole !== Role.ADMIN) {
      const workSessions = await this.workSessionService.getAllWorkSessions();
      const workSession = workSessions.find((ws) => ws.id === id);

      if (!workSession) {
        throw new BadRequestException('Work session not found');
      }

      const sessionUserId = workSession.doctorId || workSession.technicianId;
      if (sessionUserId !== userId) {
        throw new BadRequestException(
          'You can only delete your own work sessions',
        );
      }
    }

    return this.workSessionService.deleteWorkSession(id);
  }

  /**
   * Lấy work sessions theo booth
   */
  @Get('booth/:boothId')
  @Roles(Role.DOCTOR, Role.TECHNICIAN, Role.ADMIN, Role.RECEPTIONIST)
  async getWorkSessionsByBooth(
    @Param('boothId') boothId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const whereClause: any = {
      boothId,
    };

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.workSessionService
      .getAllWorkSessions(undefined, undefined, startDate, endDate)
      .then((sessions) =>
        sessions.filter((session) => session.boothId === boothId),
      );
  }

  /**
   * Lấy work sessions theo ngày cụ thể
   */
  @Get('date/:date')
  @Roles(Role.DOCTOR, Role.TECHNICIAN, Role.ADMIN, Role.RECEPTIONIST)
  async getWorkSessionsByDate(
    @Param('date') date: string,
    @Query('userType') userType?: string,
    @Query('userId') userId?: string,
  ) {
    const { startOfDay, endOfDay } = getVnDayRangeUtc(date);

    return this.workSessionService.getAllWorkSessions(
      userType,
      userId,
      startOfDay.toISOString(),
      endOfDay.toISOString(),
    );
  }
}
