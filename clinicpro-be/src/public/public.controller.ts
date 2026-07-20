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
    // 1. Lấy 1 tài khoản Bác sĩ (ưu tiên bác sĩ Sản khoa - doctor.gyn@gmail.com)
    const doctorAuth = await this.prisma.auth.findFirst({
      where: { role: Role.DOCTOR, doctor: { isNot: null } },
      include: { doctor: true },
      orderBy: { email: 'asc' }, // Luôn chọn doctor.gyn@gmail.com (Sản khoa)
    });

    // 2. Lấy 1 tài khoản Kỹ thuật viên
    const techAuth = await this.prisma.auth.findFirst({
      where: { role: Role.TECHNICIAN, technician: { isNot: null } },
      include: { technician: true },
    });

    // 3. Lấy 1 tài khoản Bệnh nhân để test đặt lịch
    const patientAuth = await this.prisma.auth.findFirst({
      where: { role: Role.PATIENT, patient: { isNot: null } },
      select: { email: true, phone: true, name: true },
      orderBy: { email: 'asc' },
    });

    if (!doctorAuth || !doctorAuth.doctor) {
      return { success: false, message: 'Không tìm thấy tài khoản Bác sĩ' };
    }
    if (!techAuth || !techAuth.technician) {
      return { success: false, message: 'Không tìm thấy tài khoản Kỹ thuật viên' };
    }

    const doctorId = doctorAuth.doctor.id;
    const techId = techAuth.technician.id;

    const now = new Date();
    const sessionStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Now - 2h
    const sessionEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000); // Now + 72h (3 ngày)

    // 3. Dọn dẹp session cũ
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next3Days = new Date(startOfToday.getTime() + 72 * 60 * 60 * 1000);
    
    // Xóa work session services trước (foreign key constraint)
    const oldSessions = await this.prisma.workSession.findMany({
      where: { OR: [{ doctorId }, { technicianId: techId }], startTime: { gte: startOfToday } },
      select: { id: true },
    });
    const oldIds = oldSessions.map(s => s.id);
    if (oldIds.length > 0) {
      await this.prisma.workSessionService.deleteMany({ where: { workSessionId: { in: oldIds } } });
      await this.prisma.workSession.deleteMany({ where: { id: { in: oldIds } } });
    }

    // 4. Tạo work sessions cho TẤT CẢ bác sĩ đang hoạt động (để demo đặt lịch)
    const allDoctors = await this.prisma.doctor.findMany({
      where: { isActive: true },
      take: 5,
    });

    const booth = await this.prisma.booth.findFirst({
      where: { isActive: true, isDeleted: false },
    });

    for (const doc of allDoctors) {
      let services = await this.prisma.service.findMany({
        where: { specialtyId: doc.specialtyId },
        take: 3,
      });
      if (!services || services.length === 0) {
        services = await this.prisma.service.findMany({ take: 3 });
      }

      // Xóa session cũ của bác sĩ này (cả services trước)
      const oldDocSessions = await this.prisma.workSession.findMany({
        where: { doctorId: doc.id, startTime: { gte: startOfToday } },
        select: { id: true },
      });
      if (oldDocSessions.length > 0) {
        await this.prisma.workSessionService.deleteMany({
          where: { workSessionId: { in: oldDocSessions.map(s => s.id) } },
        });
        await this.prisma.workSession.deleteMany({
          where: { id: { in: oldDocSessions.map(s => s.id) } },
        });
      }

      await this.prisma.workSession.create({
        data: {
          doctorId: doc.id,
          boothId: booth?.id,
          startTime: sessionStart,
          endTime: sessionEnd,
          status: WorkSessionStatus.APPROVED,
          services: {
            create: services.map((s) => ({ serviceId: s.id })),
          },
        },
      });
    }

    // Tech session
    const techBooth = await this.prisma.booth.findFirst({
      where: { isActive: true, isDeleted: false, id: booth ? { not: booth.id } : undefined },
    });
    const techServices = await this.prisma.service.findMany({
      where: { requiresDoctor: false },
      take: 3,
    });
    await this.prisma.workSession.create({
      data: {
        technicianId: techId,
        boothId: techBooth?.id || booth?.id,
        startTime: sessionStart,
        endTime: sessionEnd,
        status: WorkSessionStatus.APPROVED,
        services: {
          create: techServices.map((s) => ({ serviceId: s.id })),
        },
      },
    });

return {
      success: true,
      message: 'Môi trường Test E2E đã sẵn sàng! Hãy tiến hành đặt lịch.',
      data: {
        defaultPassword: '123456789',
        doctorName: doctorAuth.name,
        doctorEmail: doctorAuth.email,
        technicianName: techAuth.name,
        technicianEmail: techAuth.email,
        patientName: patientAuth?.name || 'N/A',
        patientEmail: patientAuth?.email || 'N/A',
        patientPhone: patientAuth?.phone || 'N/A',
      }
    };
  }
}
