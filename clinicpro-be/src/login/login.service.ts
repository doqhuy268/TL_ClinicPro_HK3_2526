import { Injectable, UnauthorizedException, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CodeGeneratorService } from '../user-management/patient-profile/code-generator.service';

// In-memory OTP store for forgot-password (demo/dev only)
const otpStore = new Map<string, { otp: string; identifier: string; expiresAt: number }>();

interface JwtPayload {
  sub: string;
  phone: string | null;
  email?: string | null;
  role?: string;
  patient?: { id: string; patientCode: string };
  doctor?: { id: string; doctorCode: string };
  technician?: { id: string; technicianCode: string };
  receptionist?: { id: string };
  admin?: { id: string };
  cashier?: { id: string; cashierCode: string };
}

interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
  refreshToken: string;
  googleId: string;
}

@Injectable()
export class LoginService {
  private codeGenerator = new CodeGeneratorService();

  constructor(
    private readonly jwtService: JwtService,
    @Inject('PRISMA') private readonly prisma: PrismaClient,
  ) {}

  async validateUser(identifier: string, password: string) {
    const auth = await this.prisma.auth.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
      },
    });
    if (!auth || !auth.password) return null;
    const isMatch = await bcrypt.compare(password, auth.password);
    if (!isMatch) return null;
    return auth;
  }

  async login(
    phoneOrEmail: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const auth = await this.validateUser(phoneOrEmail, password);
    if (!auth) throw new UnauthorizedException('Invalid credentials');

    // Lấy thông tin user và role
    const user = await this.prisma.auth.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
        gender: true,
        avatar: true,
        address: true,
        citizenId: true,
        role: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    // Tạo payload cơ bản
    const payload: JwtPayload = {
      sub: auth.id,
      phone: auth.phone,
      email: auth.email,
      role: auth.role as string,
    };

    // Thêm thông tin tương ứng với role
    if (user.role === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { authId: auth.id },
        select: { id: true, patientCode: true },
      });
      if (patient) {
        payload.patient = patient;
      }
    } else if (user.role === 'DOCTOR') {
      const doctor = await this.prisma.doctor.findUnique({
        where: { authId: auth.id },
        select: { id: true, doctorCode: true },
      });
      if (doctor) {
        payload.doctor = doctor;
      }
    } else if (user.role === 'TECHNICIAN') {
      const technician = await this.prisma.technician.findUnique({
        where: { authId: auth.id },
        select: { id: true, technicianCode: true },
      });
      if (technician) {
        payload.technician = technician;
      }
    } else if (user.role === 'RECEPTIONIST') {
      const receptionist = await this.prisma.receptionist.findUnique({
        where: { authId: auth.id },
        select: { id: true },
      });
      if (receptionist) {
        payload.receptionist = receptionist;
      }
    } else if (user.role === 'ADMIN') {
      const admin = await this.prisma.admin.findUnique({
        where: { authId: auth.id },
        select: { id: true },
      });
      if (admin) {
        payload.admin = { id: admin.id };
      }
    } else if (user.role === 'CASHIER') {
      const cashier = await this.prisma.cashier.findUnique({
        where: { authId: auth.id },
        select: { id: true, cashierCode: true },
      });
      if (cashier) {
        payload.cashier = cashier;
      }
    }

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return { accessToken, refreshToken, user };
  }

  async googleLogin(googleUser: GoogleUser) {
    console.log('🔍 Processing Google login for:', googleUser.email);
    // Kiểm tra xem user đã tồn tại chưa (tìm theo email hoặc googleId)
    let auth = await this.prisma.auth.findFirst({
      where: {
        OR: [{ email: googleUser.email }, { googleId: googleUser.googleId }],
      },
    });

    if (!auth) {
      console.log('✅ Creating new user for:', googleUser.email);
      // Tạo auth mới nếu chưa tồn tại
      auth = await this.prisma.auth.create({
        data: {
          name: `${googleUser.firstName} ${googleUser.lastName}`,
          dateOfBirth: new Date(), // Có thể cập nhật sau
          gender: 'other', // Có thể cập nhật sau
          address: '', // Có thể cập nhật sau
          role: 'PATIENT', // Mặc định là PATIENT
          avatar: googleUser.picture,
          email: googleUser.email,
          googleId: googleUser.googleId,
          accessToken: googleUser.accessToken,
          refreshToken: googleUser.refreshToken,
          tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 giờ
        },
      });
      // Tạo patient mới liên kết với auth vừa tạo
      await this.prisma.patient.create({
        data: {
          id: auth.id,
          patientCode: this.codeGenerator.generatePatientCode(
            googleUser.firstName + ' ' + googleUser.lastName,
            new Date('1990-01-01'), // Default date for Google users
            'Nam', // Default gender
          ),
          authId: auth.id,
          loyaltyPoints: 0,
        },
      });
      console.log('✅ New user created with ID:', auth.id);
    } else {
      console.log(
        '✅ User already exists, updating auth info for:',
        googleUser.email,
      );
      // Cập nhật thông tin Google nếu user đã tồn tại
      await this.prisma.auth.update({
        where: { id: auth.id },
        data: {
          googleId: googleUser.googleId,
          accessToken: googleUser.accessToken,
          refreshToken: googleUser.refreshToken,
          tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 giờ
        },
      });
      // Cập nhật avatar nếu có thay đổi
      if (auth.avatar !== googleUser.picture) {
        await this.prisma.auth.update({
          where: { id: auth.id },
          data: {
            avatar: googleUser.picture,
          },
        });
      }
    }

    if (!auth) {
      throw new UnauthorizedException('Failed to create or update user');
    }

    // Tạo JWT tokens với thông tin role tương ứng
    const payload: JwtPayload = {
      sub: auth.id,
      phone: auth.phone,
      email: auth.email,
      role: auth.role as string,
    };

    // Thêm thông tin tương ứng với role
    if (auth.role === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { authId: auth.id },
        select: { id: true, patientCode: true },
      });
      if (patient) {
        payload.patient = patient;
      }
    } else if (auth.role === 'DOCTOR') {
      const doctor = await this.prisma.doctor.findUnique({
        where: { authId: auth.id },
        select: { id: true, doctorCode: true },
      });
      if (doctor) {
        payload.doctor = doctor;
      }
    } else if (auth.role === 'TECHNICIAN') {
      const technician = await this.prisma.technician.findUnique({
        where: { authId: auth.id },
        select: { id: true, technicianCode: true },
      });
      if (technician) {
        payload.technician = technician;
      }
    } else if (auth.role === 'RECEPTIONIST') {
      const receptionist = await this.prisma.receptionist.findUnique({
        where: { authId: auth.id },
        select: { id: true },
      });
      if (receptionist) {
        payload.receptionist = receptionist;
      }
    } else if (auth.role === 'ADMIN') {
      const admin = await this.prisma.admin.findUnique({
        where: { authId: auth.id },
        select: { id: true },
      });
      if (admin) {
        payload.admin = { id: admin.id };
      }
    } else if (auth.role === 'CASHIER') {
      const cashier = await this.prisma.cashier.findUnique({
        where: { authId: auth.id },
        select: { id: true, cashierCode: true },
      });
      if (cashier) {
        payload.cashier = cashier;
      }
    }

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const user = {
      id: auth.id,
      name: auth.name,
      dateOfBirth: auth.dateOfBirth,
      gender: auth.gender,
      avatar: auth.avatar,
      address: auth.address,
      citizenId: auth.citizenId,
      role: auth.role,
    };

    return { accessToken, refreshToken, user };
  }

  async refresh(refreshToken: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payloadRaw = this.jwtService.verify(refreshToken);
      if (typeof payloadRaw !== 'object' || payloadRaw === null) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const { sub, phone } = payloadRaw as Record<string, unknown>;
      if (typeof sub !== 'string' || typeof phone !== 'string') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload: JwtPayload = { sub, phone };

      const auth = await this.prisma.auth.findUnique({
        where: { id: payload.sub },
      });
      if (!auth) throw new UnauthorizedException('Invalid refresh token');

      const newAccessToken = this.jwtService.sign(
        { sub: auth.id, phone: auth.phone },
        { expiresIn: '15m' },
      );

      const newRefreshToken = this.jwtService.sign(
        { sub: auth.id, phone: auth.phone },
        { expiresIn: '7d' },
      );
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserByToken(accessToken: string): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payloadRaw = this.jwtService.verify(accessToken);
      if (typeof payloadRaw !== 'object' || payloadRaw === null) {
        throw new UnauthorizedException('Invalid token');
      }
      const { sub } = payloadRaw as Record<string, unknown>;
      if (typeof sub !== 'string') {
        throw new UnauthorizedException('Invalid token');
      }

      const auth = await this.prisma.auth.findUnique({
        where: { id: sub },
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
          email: true,
          phone: true,
          gender: true,
          avatar: true,
          address: true,
          citizenId: true,
          role: true,
          // Role-specific data
          patient: {
            select: {
              id: true,
              patientCode: true,
              loyaltyPoints: true,
            },
          },
          doctor: {
            select: {
              id: true,
              doctorCode: true,
              yearsExperience: true,
              rating: true,
              workHistory: true,
              description: true,
            },
          },
          technician: {
            select: {
              id: true,
              technicianCode: true,
            },
          },
          receptionist: {
            select: {
              id: true,
            },
          },
          admin: {
            select: {
              id: true,
              adminCode: true,
            },
          },
          cashier: {
            select: {
              id: true,
              cashierCode: true,
            },
          },
        },
      });
      if (!auth) throw new UnauthorizedException('User not found');
      return auth;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async logout(
    accessToken: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verify token to get user id
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payloadRaw = this.jwtService.verify(accessToken);
    if (typeof payloadRaw !== 'object' || payloadRaw === null) {
      throw new UnauthorizedException('Invalid token');
    }
    const { sub } = payloadRaw as Record<string, unknown>;
    if (typeof sub !== 'string') {
      throw new UnauthorizedException('Invalid token');
    }

    // Best-effort: clear stored provider tokens. Use updateMany to avoid throwing if user is missing
    await this.prisma.auth.updateMany({
      where: { id: sub },
      data: {
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
      },
    });

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Quên mật khẩu - Bước 1: Gửi OTP
   * Tìm user theo email/phone, tạo OTP, lưu vào memory store, log ra console (dev)
   */
  async forgotPassword(identifier: string): Promise<{ message: string; otpDev?: string }> {
    const auth = await this.prisma.auth.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
      },
      select: { id: true, phone: true, email: true, name: true },
    });

    if (!auth) {
      // Vẫn trả về message chung để không leak thông tin user
      return {
        message: 'Nếu thông tin tồn tại trong hệ thống, mã OTP sẽ được gửi đến email/số điện thoại của bạn.',
      };
    }

    // Tạo OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

    // Lưu vào memory store (dev/demo only)
    otpStore.set(auth.id, { otp, identifier, expiresAt });

    // Log OTP ra console (thay vì gửi email/SMS thật)
    console.log('═══════════════════════════════════════');
    console.log(`🔐 [FORGOT PASSWORD] OTP cho ${auth.name || identifier}:`);
    console.log(`   📧 Email/Phone: ${identifier}`);
    console.log(`   🔢 OTP: ${otp}`);
    console.log(`   ⏰ Hết hạn: 5 phút`);
    console.log('═══════════════════════════════════════');

    return {
      message: 'Nếu thông tin tồn tại trong hệ thống, mã OTP sẽ được gửi đến email/số điện thoại của bạn.',
      otpDev: otp, // Chỉ trả về trong môi trường dev để test
    };
  }

  /**
   * Quên mật khẩu - Bước 2: Xác thực OTP & Đặt lại mật khẩu
   */
  async resetPassword(
    identifier: string,
    otp: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const auth = await this.prisma.auth.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
      },
      select: { id: true },
    });

    if (!auth) {
      throw new NotFoundException('Không tìm thấy tài khoản với thông tin này');
    }

    // Kiểm tra OTP từ memory store
    const stored = otpStore.get(auth.id);
    if (!stored) {
      throw new BadRequestException('OTP đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới.');
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(auth.id);
      throw new BadRequestException('OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
    }

    if (stored.otp !== otp) {
      throw new BadRequestException('OTP không chính xác.');
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    await this.prisma.auth.update({
      where: { id: auth.id },
      data: { password: hashedPassword },
    });

    // Xóa OTP khỏi store
    otpStore.delete(auth.id);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' };
  }
}
