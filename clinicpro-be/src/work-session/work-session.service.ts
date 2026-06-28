/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * Lịch làm việc & ca khám bác sĩ.
 * Phạm vi tối giản: giữ lịch + trạng thái ca (mở/đóng); không triển khai tối ưu slot phức tạp.
 */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkSessionDto,
  CreateWorkSessionsDto,
  UpdateWorkSessionDto,
  GetWorkSessionsBySpecialtyDto,
} from './dto';
import { Prisma, WorkSessionStatus, Role } from '@prisma/client';
import {
  parseIsoAsVnToUtc,
  getVnDayRangeUtc,
  getTodayVnDateStr,
} from '../common/timezone';

@Injectable()
export class WorkSessionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo nhiều work sessions cùng lúc với validation trùng lịch
   */
  async createWorkSessions(
    createWorkSessionsDto: CreateWorkSessionsDto,
    userId: string,
    userRole: Role,
  ) {
    const { workSessions } = createWorkSessionsDto;

    // Validate user và lấy thông tin user
    const userInfo = await this.getUserInfo(userId, userRole);

    // Validate từng work session
    for (const workSession of workSessions) {
      await this.validateWorkSession(workSession, userInfo);
    }

    // Validate không trùng lịch giữa các sessions trong request
    this.validateNoOverlapInRequest(workSessions, userInfo);

    // Tạo work sessions
    const createdSessions: any[] = [];
    for (const workSession of workSessions) {
      const created = await this.createSingleWorkSession(workSession, userInfo);
      createdSessions.push(created);
    }

    return {
      message: 'Work sessions created successfully',
      data: createdSessions,
      count: createdSessions.length,
    };
  }

  /**
   * Xác định role từ authId (dùng khi ADMIN tạo lịch thay cho user khác)
   */
  async resolveRoleFromAuthId(authId: string): Promise<Role> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { authId },
    });
    if (doctor) return 'DOCTOR' as Role;
    const technician = await this.prisma.technician.findUnique({
      where: { authId },
    });
    if (technician) return 'TECHNICIAN' as Role;
    throw new BadRequestException(
      `Không tìm thấy Bác sĩ hoặc Kỹ thuật viên với authId ${authId}.`,
    );
  }

  /**
   * Lấy thông tin user từ authId và role
   */
  private async getUserInfo(authId: string, userRole: Role) {
    console.log('🔍 getUserInfo - authId:', authId, 'userRole:', userRole);

    if (userRole === Role.DOCTOR) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { authId },
        include: {
          auth: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!doctor) {
        throw new NotFoundException(`Doctor not found for auth ID ${authId}`);
      }

      return {
        id: doctor.id,
        authId: doctor.authId,
        userType: 'DOCTOR' as const,
        name: doctor.auth.name,
      };
    } else if (userRole === Role.TECHNICIAN) {
      const technician = await this.prisma.technician.findUnique({
        where: { authId },
        include: {
          auth: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

      if (!technician) {
        throw new NotFoundException(
          `Technician not found for auth ID ${authId}`,
        );
      }

      return {
        id: technician.id,
        authId: technician.authId,
        userType: 'TECHNICIAN' as const,
        name: technician.auth.name,
      };
    } else if (userRole === Role.ADMIN) {
      throw new BadRequestException(
        'ADMIN chưa hỗ trợ tạo lịch trực tiếp. Vui lòng đăng nhập bằng tài khoản Bác sĩ hoặc Kỹ thuật viên để tạo lịch.',
      );
    } else {
      throw new BadRequestException(
        `Vai trò ${userRole} không thể tạo lịch làm việc. Chỉ Bác sĩ và Kỹ thuật viên được phép.`,
      );
    }
  }

  /**
   * Tạo một work session đơn lẻ
   */
  async createSingleWorkSession(
    createWorkSessionDto: CreateWorkSessionDto,
    userInfo: any,
  ) {
    const { startTime, endTime, serviceIds } = createWorkSessionDto;

    // Debug timezone
    console.log('🔍 Debug timezone - Input startTime:', startTime);
    console.log('🔍 Debug timezone - Input endTime:', endTime);

    let parsedStartTime: Date;
    let parsedEndTime: Date;

    try {
      // Nếu có 'Z' = UTC. Không có = coi là giờ VN, chuyển sang UTC
      parsedStartTime = parseIsoAsVnToUtc(startTime);
      parsedEndTime = parseIsoAsVnToUtc(endTime);

      console.log(
        '🔍 Debug timezone - Input startTime:',
        startTime,
        '-> Parsed as UTC:',
        parsedStartTime.toISOString(),
      );
      console.log(
        '🔍 Debug timezone - Input endTime:',
        endTime,
        '-> Parsed as UTC:',
        parsedEndTime.toISOString(),
      );
    } catch (error) {
      console.error('🔍 Debug timezone - Error parsing time:', error);
      throw new BadRequestException(
        'Invalid time format. Use ISO 8601 format (e.g., 2025-09-17T21:00:00Z)',
      );
    }

    // Validate services exist
    await this.validateServicesExist(serviceIds);

    // Tự động tìm booth phù hợp
    const boothId = await this.findSuitableBooth(
      serviceIds,
      startTime,
      endTime,
    );

    // Tạo work session
    const workSession = await this.prisma.workSession.create({
      data: {
        doctorId: userInfo.userType === 'DOCTOR' ? userInfo.id : null,
        technicianId: userInfo.userType === 'TECHNICIAN' ? userInfo.id : null,
        boothId,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        status: WorkSessionStatus.PENDING,
        services: {
          create: serviceIds.map((serviceId) => ({
            serviceId,
          })),
        },
      },
      include: {
        doctor: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        technician: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        booth: {
          include: {
            room: {
              include: {
                specialty: true,
              },
            },
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    return workSession;
  }

  /**
   * Tự động tìm booth phù hợp dựa vào services và thời gian.
   * 1) Ưu tiên: booth có đầy đủ dịch vụ qua BoothService và trống lịch.
   * 2) Fallback (phạm vi tối giản): nếu không có, dùng booth trống bất kỳ.
   * 3) Cuối cùng: tạo lịch không gán booth (boothId = null).
   */
  private async findSuitableBooth(
    serviceIds: string[],
    startTime: string,
    endTime: string,
  ): Promise<string | null> {
    const sessionStart = new Date(startTime);
    const sessionEnd = new Date(endTime);

    const hasOverlap = (ws: { startTime: Date; endTime: Date }) =>
      (ws.startTime < sessionEnd && ws.endTime > sessionStart);

    // 1) Booth có đầy đủ dịch vụ qua BoothService
    const candidateBooths = await this.prisma.booth.findMany({
      where: {
        isActive: true,
        isDeleted: { not: true },
        boothServices: {
          some: {
            serviceId: { in: serviceIds },
            isActive: true,
          },
        },
      },
      include: {
        boothServices: {
          where: { isActive: true },
          select: { serviceId: true },
        },
        workSessions: {
          where: { status: { not: WorkSessionStatus.CANCELED } },
          select: { startTime: true, endTime: true },
        },
      },
    });

    const suitableBooths = candidateBooths.filter((booth) => {
      const boothServiceIds = booth.boothServices.map((bs) => bs.serviceId);
      const hasAllServices = serviceIds.every((id) => boothServiceIds.includes(id));
      return hasAllServices;
    });

    for (const booth of suitableBooths) {
      if (!booth.workSessions.some(hasOverlap)) return booth.id;
    }

    // 2) Fallback: booth trống bất kỳ (phạm vi tối giản khi chưa có BoothService)
    const anyBooths = await this.prisma.booth.findMany({
      where: { isActive: true, isDeleted: { not: true } },
      include: {
        workSessions: {
          where: { status: { not: WorkSessionStatus.CANCELED } },
          select: { startTime: true, endTime: true },
        },
      },
    });

    for (const booth of anyBooths) {
      if (!booth.workSessions.some(hasOverlap)) return booth.id;
    }

    // 3) Không có booth trống → cho phép tạo lịch không gán booth
    return null;
  }

  /**
   * Validate work session không trùng lịch với các sessions hiện có
   */
  private async validateWorkSession(
    workSession: CreateWorkSessionDto,
    userInfo: any,
  ) {
    const { startTime, endTime } = workSession;

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate thời gian
    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Validate không trùng lịch với sessions hiện có
    const whereClause = {
      AND: [
        {
          OR: [
            userInfo.userType === 'DOCTOR'
              ? { doctorId: userInfo.id }
              : { technicianId: userInfo.id },
          ],
        },
        {
          status: {
            not: WorkSessionStatus.CANCELED,
          },
        },
        {
          OR: [
            // Session mới bắt đầu trong khoảng thời gian session cũ
            {
              startTime: { lte: start },
              endTime: { gt: start },
            },
            // Session mới kết thúc trong khoảng thời gian session cũ
            {
              startTime: { lt: end },
              endTime: { gte: end },
            },
            // Session mới bao trùm session cũ
            {
              startTime: { gte: start },
              endTime: { lte: end },
            },
            // Session cũ bao trùm session mới
            {
              startTime: { lte: start },
              endTime: { gte: end },
            },
          ],
        },
      ],
    };

    const conflictingSessions = await this.prisma.workSession.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            auth: {
              select: {
                name: true,
              },
            },
          },
        },
        technician: {
          include: {
            auth: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (conflictingSessions.length > 0) {
      throw new BadRequestException(
        `Work session conflicts with existing schedule for ${userInfo.name}. ` +
          `Conflicting time: ${start.toLocaleString()} - ${end.toLocaleString()}`,
      );
    }
  }

  /**
   * Validate không trùng lịch giữa các sessions trong cùng request
   */
  private validateNoOverlapInRequest(
    workSessions: CreateWorkSessionDto[],
    userInfo: any,
  ) {
    for (let i = 0; i < workSessions.length; i++) {
      for (let j = i + 1; j < workSessions.length; j++) {
        const session1 = workSessions[i];
        const session2 = workSessions[j];

        const start1 = new Date(session1.startTime);
        const end1 = new Date(session1.endTime);
        const start2 = new Date(session2.startTime);
        const end2 = new Date(session2.endTime);

        // Check overlap
        if (start1 < end2 && start2 < end1) {
          throw new BadRequestException(
            `Work sessions overlap for ${userInfo.name}. ` +
              `Session 1: ${start1.toLocaleString()} - ${end1.toLocaleString()}, ` +
              `Session 2: ${start2.toLocaleString()} - ${end2.toLocaleString()}`,
          );
        }
      }
    }
  }

  /**
   * Validate services exist
   */
  private async validateServicesExist(serviceIds: string[]) {
    const services = await this.prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
    });

    if (services.length !== serviceIds.length) {
      const foundIds = services.map((s) => s.id);
      const missingIds = serviceIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Services not found: ${missingIds.join(', ')}`,
      );
    }
  }

  /**
   * Lấy work sessions theo user
   */
  async getWorkSessionsByUser(
    authId: string,
    userType: string,
    startDate?: string,
    endDate?: string,
  ) {
    // Lấy user info từ authId
    const userInfo = await this.getUserInfo(
      authId,
      userType === 'DOCTOR' ? Role.DOCTOR : Role.TECHNICIAN,
    );

    const whereClause: any = {
      OR: [
        userType === 'DOCTOR'
          ? { doctorId: userInfo.id }
          : { technicianId: userInfo.id },
      ],
    };

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    return this.prisma.workSession.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        technician: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        booth: {
          include: {
            room: {
              include: {
                specialty: true,
              },
            },
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Lấy các phiên làm việc trong ngày hiện tại cho user với nhiều trạng thái
   */
  async getTodayWorkSessionsByUser(
    userType: 'DOCTOR' | 'TECHNICIAN',
    userId: string,
    statuses: WorkSessionStatus[] = [
      WorkSessionStatus.APPROVED,
      WorkSessionStatus.IN_PROGRESS,
      WorkSessionStatus.COMPLETED,
    ],
  ) {
    const todayVn = getTodayVnDateStr();
    const { startOfDay, endOfDay } = getVnDayRangeUtc(todayVn);

    const whereClause: any = {
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: statuses,
      },
      ...(userType === 'DOCTOR'
        ? { doctorId: userId }
        : { technicianId: userId }),
    };

    return this.prisma.workSession.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        technician: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        booth: {
          include: {
            room: {
              include: {
                specialty: true,
              },
            },
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Cập nhật work session
   */
  async updateWorkSession(
    id: string,
    updateWorkSessionDto: UpdateWorkSessionDto,
    actorRole?: Role,
  ) {
    const existingSession = await this.prisma.workSession.findUnique({
      where: { id },
    });

    if (!existingSession) {
      throw new NotFoundException(`Work session with ID ${id} not found`);
    }

    if (
      existingSession.status === WorkSessionStatus.COMPLETED &&
      updateWorkSessionDto.status &&
      updateWorkSessionDto.status !== existingSession.status
    ) {
      throw new BadRequestException(
        'Cannot update status of a completed work session',
      );
    }

    const isCancelRequest =
      updateWorkSessionDto.status === WorkSessionStatus.CANCELED;

    if (isCancelRequest) {
      if (existingSession.status === WorkSessionStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed work session');
      }

      if (
        actorRole === Role.DOCTOR &&
        existingSession.status !== WorkSessionStatus.PENDING
      ) {
        throw new BadRequestException(
          'Doctors can only cancel work sessions in PENDING status',
        );
      }

      const activeAppointments = await this.prisma.appointment.findMany({
        where: {
          workSessionId: id,
          status: {
            not: 'CANCELLED',
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (activeAppointments.length > 0) {
        throw new BadRequestException(
          'Cannot cancel work session because appointments are not all cancelled',
        );
      }
    }

    // Nếu cập nhật thời gian, cần validate lại
    if (updateWorkSessionDto.startTime || updateWorkSessionDto.endTime) {
      const startTime =
        updateWorkSessionDto.startTime ||
        existingSession.startTime.toISOString();
      const endTime =
        updateWorkSessionDto.endTime || existingSession.endTime.toISOString();

      const userId = existingSession.doctorId || existingSession.technicianId;
      const userType = existingSession.doctorId ? 'DOCTOR' : 'TECHNICIAN';

      // Validate với sessions khác (trừ session hiện tại)
      await this.validateWorkSessionUpdate(
        id,
        userId!,
        userType,
        startTime,
        endTime,
      );
    }

    return this.prisma.workSession.update({
      where: { id },
      data: {
        ...updateWorkSessionDto,
        startTime: updateWorkSessionDto.startTime
          ? new Date(updateWorkSessionDto.startTime)
          : undefined,
        endTime: updateWorkSessionDto.endTime
          ? new Date(updateWorkSessionDto.endTime)
          : undefined,
      },
      include: {
        doctor: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        technician: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        booth: {
          include: {
            room: {
              include: {
                specialty: true,
              },
            },
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  /**
   * Validate work session update không trùng lịch
   */
  private async validateWorkSessionUpdate(
    sessionId: string,
    userId: string,
    userType: string,
    startTime: string,
    endTime: string,
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    const whereClause = {
      AND: [
        {
          id: { not: sessionId }, // Loại trừ session hiện tại
        },
        {
          OR: [
            userType === 'DOCTOR'
              ? { doctorId: userId }
              : { technicianId: userId },
          ],
        },
        {
          status: {
            not: WorkSessionStatus.CANCELED,
          },
        },
        {
          OR: [
            {
              startTime: { lte: start },
              endTime: { gt: start },
            },
            {
              startTime: { lt: end },
              endTime: { gte: end },
            },
            {
              startTime: { gte: start },
              endTime: { lte: end },
            },
            {
              startTime: { lte: start },
              endTime: { gte: end },
            },
          ],
        },
      ],
    };

    const conflictingSessions = await this.prisma.workSession.findMany({
      where: whereClause,
    });

    if (conflictingSessions.length > 0) {
      throw new BadRequestException(
        `Work session conflicts with existing schedule. ` +
          `Conflicting time: ${start.toLocaleString()} - ${end.toLocaleString()}`,
      );
    }
  }

  /**
   * Xóa work session
   */
  async deleteWorkSession(id: string) {
    const existingSession = await this.prisma.workSession.findUnique({
      where: { id },
      include: {
        services: true,
      },
    });

    if (!existingSession) {
      throw new NotFoundException(`Work session with ID ${id} not found`);
    }

    // Xóa tất cả WorkSessionService liên quan trước
    if (existingSession.services && existingSession.services.length > 0) {
      await this.prisma.workSessionService.deleteMany({
        where: {
          workSessionId: id,
        },
      });
    }

    // Sau đó xóa WorkSession
    try {
      return await this.prisma.workSession.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Cannot delete work session because there are existing appointments linked to it. Please cancel or remove related appointments first.',
        );
      }
      throw error;
    }
  }

  /**
   * Lấy tất cả work sessions với filter
   */
  async getAllWorkSessions(
    userType?: string,
    userId?: string,
    startDate?: string,
    endDate?: string,
    status?: WorkSessionStatus,
  ) {
    const whereClause: any = {};

    if (userType && userId) {
      if (userType === 'DOCTOR') {
        whereClause.doctorId = userId;
      } else {
        whereClause.technicianId = userId;
      }
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    return this.prisma.workSession.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        technician: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        booth: {
          include: {
            room: {
              include: {
                specialty: true,
              },
            },
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  /**
   * Lấy work sessions theo chuyên khoa (dành cho admin)
   */
  async getWorkSessionsBySpecialty(query: GetWorkSessionsBySpecialtyDto) {
    const specialtyId =
      typeof query.specialtyId === 'string' ? query.specialtyId : undefined;
    const specialtyCode =
      typeof query.specialtyCode === 'string' ? query.specialtyCode : undefined;
    const startDate =
      typeof query.startDate === 'string' ? query.startDate : undefined;
    const endDate =
      typeof query.endDate === 'string' ? query.endDate : undefined;
    const status =
      typeof query.status === 'string'
        ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          (query.status as WorkSessionStatus)
        : undefined;
    const doctorId =
      typeof query.doctorId === 'string' ? query.doctorId : undefined;
    const technicianId =
      typeof query.technicianId === 'string' ? query.technicianId : undefined;

    const where: Prisma.WorkSessionWhereInput = {};

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (technicianId) {
      where.technicianId = technicianId;
    }

    const timeFilter: Prisma.DateTimeFilter = {};
    if (typeof startDate === 'string') {
      timeFilter.gte = new Date(startDate);
      console.log('🔍 Debug timeFilter - startDate:', timeFilter.gte);
    }
    if (typeof endDate === 'string') {
      timeFilter.lte = new Date(endDate);
      console.log('🔍 Debug timeFilter - endDate:', timeFilter.lte);
    }
    if (Object.keys(timeFilter).length > 0) {
      where.startTime = timeFilter;
    }

    if (status) {
      where.status = status;
    }

    if (specialtyId || specialtyCode) {
      const specialtyFilter: Prisma.ClinicRoomWhereInput = {};
      if (specialtyId) {
        specialtyFilter.specialtyId = specialtyId;
      }
      if (specialtyCode) {
        specialtyFilter.specialty = {
          is: {
            specialtyCode,
          },
        };
      }

      where.booth = {
        is: {
          room: {
            is: specialtyFilter,
          },
        },
      };
    }

    const sessions = await this.prisma.workSession.findMany({
      where,
      include: {
        doctor: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        technician: {
          include: {
            auth: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        booth: {
          include: {
            room: {
              include: {
                specialty: true,
              },
            },
          },
        },
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    type SpecialtySummary = {
      specialty: {
        id: string;
        name: string;
        specialtyCode: string;
      } | null;
      total: number;
      statusCounts: Partial<Record<WorkSessionStatus, number>>;
    };

    const statsMap = new Map<string, SpecialtySummary>();

    sessions.forEach((session) => {
      const specialty = session.booth?.room?.specialty;
      const key = specialty?.id ?? 'NO_SPECIALTY';

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          specialty: specialty
            ? {
                id: specialty.id,
                name: specialty.name,
                specialtyCode: specialty.specialtyCode,
              }
            : null,
          total: 0,
          statusCounts: {},
        });
      }

      const summary = statsMap.get(key)!;
      summary.total += 1;
      summary.statusCounts[session.status] =
        (summary.statusCounts[session.status] ?? 0) + 1;
    });

    return {
      total: sessions.length,
      filters: {
        specialtyId,
        specialtyCode,
        startDate,
        endDate,
        status,
        doctorId,
        technicianId,
      },
      specialtyStats: Array.from(statsMap.values()),
      sessions,
    };
  }
}
