import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  Req,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LoginService } from './login.service';
import { GoogleAuthGuard } from './google.guard';
import { Request, Response } from 'express';
import axios from 'axios';
import {
  LoginDto,
  RefreshTokenDto,
  GoogleTokenDto,
  AuthResponseDto,
  UserDto,
  TokenResponseDto,
  AuthCallbackDto,
  ErrorResponseDto,
  LogoutResponseDto,
} from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class LoginController {
  constructor(private readonly authService: LoginService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập với email/phone và mật khẩu' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập không hợp lệ' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto.identifier, loginDto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới access token bằng refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Làm mới token thành công',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ' })
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng thành công',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Thiếu hoặc không hợp lệ authorization header',
  })
  async getMe(
    @Headers('authorization') authHeader: string,
  ): Promise<UserDto | ErrorResponseDto> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid Authorization header' };
    }
    const accessToken = authHeader.replace('Bearer ', '');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.authService.getUserByToken(accessToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất người dùng hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Đăng xuất thành công',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Thiếu hoặc không hợp lệ authorization header',
  })
  async logout(
    @Headers('authorization') authHeader: string,
  ): Promise<LogoutResponseDto | ErrorResponseDto> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid Authorization header' };
    }
    const accessToken = authHeader.replace('Bearer ', '');
    return this.authService.logout(accessToken);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Khởi tạo xác thực Google OAuth2' })
  async googleAuth() {
    // Guard sẽ xử lý việc redirect đến Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Xử lý callback Google OAuth2' })
  async googleAuthCallback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('platform') platform?: string,
    @Query('redirect_uri') redirectUri?: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = req.user as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await this.authService.googleLogin(user);

    if (platform === 'mobile' && redirectUri) {
      // Redirect về deep link cho mobile
      const queryParams = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: encodeURIComponent(JSON.stringify(result.user)),
      });
      return res.redirect(`${redirectUri}?${queryParams.toString()}`);
    }

    // Redirect về frontend với tokens (web)
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const queryParams = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: JSON.stringify(result.user),
    });
    const finalUrl = `${redirectUrl}/api/auth/callback?${queryParams.toString()}`;
    res.redirect(finalUrl);
  }

  @Post('google/token')
  @ApiOperation({ summary: 'Đổi authorization code của Google lấy tokens' })
  @ApiBody({ type: GoogleTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập Google thành công',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Authorization code không hợp lệ' })
  async googleToken(
    @Body() googleTokenDto: GoogleTokenDto,
  ): Promise<AuthResponseDto> {
    try {
      console.log('🔍 Starting Google OAuth2 token exchange...');
      console.log('📝 Received code:', googleTokenDto.code);
      // Decode URL encoded authorization code
      const decodedCode = decodeURIComponent(googleTokenDto.code);
      console.log('🔓 Decoded code:', decodedCode);

      // Exchange authorization code for tokens
      console.log('🔄 Exchanging code for tokens...');
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code: decodedCode,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_CALLBACK_URL,
          grant_type: 'authorization_code',
        },
      );

      console.log('✅ Token exchange successful');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { access_token, refresh_token } = tokenResponse.data;

      // Get user info from Google
      console.log('👤 Getting user info from Google...');
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      console.log('✅ User info received');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const userInfo = userInfoResponse.data;
      console.log('👤 User info:', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        email: userInfo.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        name: `${userInfo.given_name} ${userInfo.family_name}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: userInfo.id,
      });

      // Create Google user object
      const googleUser = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        email: userInfo.email,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        firstName: userInfo.given_name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        lastName: userInfo.family_name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        picture: userInfo.picture,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        accessToken: access_token,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        refreshToken: refresh_token,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        googleId: userInfo.id,
      };

      console.log('🔄 Processing Google login...');
      // Process login
      const result = await this.authService.googleLogin(googleUser);
      console.log('✅ Google login successful');
      return result;
    } catch (error) {
      console.error('❌ Google OAuth2 Error:', error);
      if (axios.isAxiosError(error)) {
        console.error('❌ Axios Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: error.config?.data,
          },
        });
        if (error.response?.status === 400) {
          throw new Error(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            `Google OAuth2 Error: ${error.response.data.error_description || error.response.data.error}`,
          );
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Failed to authenticate with Google: ${error.message}`);
    }
  }

  @Get('callback')
  @ApiOperation({ summary: 'Xử lý OAuth2 callback với tokens' })
  @ApiResponse({
    status: 200,
    description: 'Xử lý callback thành công',
    type: AuthCallbackDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Thiếu tokens hoặc dữ liệu người dùng không hợp lệ',
  })
  authCallback(@Query() query: any): AuthCallbackDto | ErrorResponseDto {
    // Xử lý callback từ Google OAuth2 redirect
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { accessToken, refreshToken, user } = query;
    if (!accessToken || !refreshToken) {
      return { error: 'Missing tokens' };
    }
    try {
      // Decode user data nếu cần
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const userData =
        typeof user === 'string' ? JSON.parse(decodeURIComponent(user)) : user;
      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        accessToken,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        refreshToken,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user: userData,
        message: 'Google OAuth2 login successful!',
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return { error: 'Invalid user data' };
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Quên mật khẩu - Gửi OTP đến email/phone' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { identifier: { type: 'string', description: 'Email hoặc số điện thoại' } },
      required: ['identifier'],
    },
  })
  async forgotPassword(@Body('identifier') identifier: string) {
    return this.authService.forgotPassword(identifier);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu với OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        identifier: { type: 'string', description: 'Email hoặc số điện thoại' },
        otp: { type: 'string', description: 'Mã OTP 6 chữ số' },
        newPassword: { type: 'string', description: 'Mật khẩu mới' },
      },
      required: ['identifier', 'otp', 'newPassword'],
    },
  })
  async resetPassword(
    @Body('identifier') identifier: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(identifier, otp, newPassword);
  }
}
