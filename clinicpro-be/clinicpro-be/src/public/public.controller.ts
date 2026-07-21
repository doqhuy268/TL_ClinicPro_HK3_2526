import { Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../rbac/public.decorator';
import { Role } from '../rbac/roles.enum';
import { WorkSessionStatus } from '@prisma/client';

@Controller('public')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách bác sĩ (public)
   * GET /public/doctors
   * Optional query: specialtyId, specialtyName (filter)
   */
  @Get('doctors')
  @Public()
  async getDoctors(
    @Query('specialtyId') specialtyId?: string,
    @Query('specialtyName') specialtyName?: string,
  ) {
    const where = {
      role: Role.DOCTOR,
      doctor: {
        is: {
          ...(specialtyId && { specialtyId }),
          ...(specialtyName && {
            specialty: {
              is: {
                name: { contains: specialtyName },
              },
            },
          }),
        },
      },
    };

    return this.prisma.auth.findMany({
      where,
      select: {
        id: true,
        name: true,
        avatar: true,
        doctor: {
          select: {
            id: true,
            doctorCode: true,
            yearsExperience: true,
            rating: true,
            workHistory: true,
            description: true,
            specialty: {
              select: { id: true, specialtyCode: true, name: true, description: true, imgUrl: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Lấy danh sách chuyên khoa (public)
   * GET /public/specialties
   */
  @Get('specialties')
  @Public()
  async getSpecialties() {
    return this.prisma.specialty.findMany({
      select: {
        id: true,
        specialtyCode: true,
        name: true,
        imgUrl: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * DEV: Nhanh chóng tạo WorkSession cho Bác sĩ và Kỹ thuật viên ở khung giờ hiện tại
   * Bỏ qua mọi Validate để Test (Night-shift Test Setup)
   */
  @Post('dev/quick-setup')
  @Public()
  async devQuickSetup() {
    // 1. Lấy 1 tài khoản Bác sĩ
    const doctorAuth = await this.prisma.auth.findFirst({
      where: { role: Role.DOCTOR, doctor: { isNot: null } },
      include: { doctor: true },
    });

    // 2. Lấy 1 tài khoản Kỹ thuật viên
    const techAuth = await this.prisma.auth.findFirst({
      where: { role: Role.TECHNICIAN, technician: { isNot: null } },
      include: { technician: true },
    });

    if (!doctorAuth || !doctorAuth.doctor) {
      return { success: false, message: 'Không tìm thấy tài khoản Bác sĩ' };
    }
    if (!techAuth || !techAuth.technician) {
      return { success: false, message: 'Không tìm thấy tài khoản Kỹ thuật viên' };
    }

    const doctorId = doctorAuth.doctor.id;
    const techId = techAuth.technician.id;
    const doctorSpecialtyId = doctorAuth.doctor.specialtyId;

    const now = new Date();
    const sessionStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Now - 2h
    const sessionEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000); // Now + 72h (3 ngày)

    // 3. Dọn dẹp session cũ trong ngày của 2 user này để tranh conflict
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const next3Days = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    
    await this.prisma.workSession.deleteMany({
      where: {
        OR: [
          { doctorId: doctorId },
          { technicianId: techId }
        ],
        startTime: { gte: startOfToday },
        endTime: { lte: next3Days }
      }
    });

    // 4. Tìm booth
    const doctorBooth = await this.prisma.booth.findFirst({
      where: { isActive: true, isDeleted: false },
    });
    
    // Tìm booth thứ 2 cho KTV tránh trùng id nếu có thể
    const techBooth = await this.prisma.booth.findFirst({
      where: { isActive: true, isDeleted: false, id: doctorBooth ? { not: doctorBooth.id } : undefined },
    });

    // 5. Tạo dịch vụ
    // Tìm dịch vụ thuộc khoa Bác sĩ, hoặc fallback sang các dịch vụ yêu cầu có bác sĩ nếu khoa này trống
    let doctorServices = await this.prisma.service.findMany({
      where: { specialtyId: doctorSpecialtyId },
      take: 3,
    });

    if (!doctorServices || doctorServices.length === 0) {
      doctorServices = await this.prisma.service.findMany({
        take: 3, // Bốc đại 3 dịch vụ bất kì vì database seed thiếu dịch vụ cho khoa này
      });
    }

    // Filter services that don't already have a valid work session link if needed, but it's new session anyway
    const doctorServiceIds = doctorServices.map((s) => ({ serviceId: s.id }));

    // Tech services
    const techServices = await this.prisma.service.findMany({
      where: { requiresDoctor: false },
      take: 3,
    });
    const techServiceIds = techServices.map((s) => ({ serviceId: s.id }));

    // Create session cho Doctor
    if (doctorServiceIds.length > 0) {
      await this.prisma.workSession.create({
        data: {
          doctorId: doctorId,
          boothId: doctorBooth?.id,
          startTime: sessionStart,
          endTime: sessionEnd,
          status: WorkSessionStatus.APPROVED,
          services: {
            create: doctorServiceIds,
          },
        },
      });
    } else {
      await this.prisma.workSession.create({
        data: {
          doctorId: doctorId,
          boothId: doctorBooth?.id,
          startTime: sessionStart,
          endTime: sessionEnd,
          status: WorkSessionStatus.APPROVED,
        },
      });
    }

    // Create session cho Tech
    if (techServiceIds.length > 0) {
      await this.prisma.workSession.create({
        data: {
          technicianId: techId,
          boothId: techBooth?.id,
          startTime: sessionStart,
          endTime: sessionEnd,
          status: WorkSessionStatus.APPROVED,
          services: {
            create: techServiceIds,
          },
        },
      });
    } else {
      await this.prisma.workSession.create({
        data: {
          technicianId: techId,
          boothId: techBooth?.id,
          startTime: sessionStart,
          endTime: sessionEnd,
          status: WorkSessionStatus.APPROVED,
        },
      });
    }

    return {
      success: true,
      message: 'Môi trường Test E2E đã sẵn sàng! Hãy tiến hành đặt lịch.',
      data: {
        doctorName: doctorAuth.name,
        doctorEmail: doctorAuth.email,
        technicianName: techAuth.name,
        technicianEmail: techAuth.email
      }
    };
  }
}
