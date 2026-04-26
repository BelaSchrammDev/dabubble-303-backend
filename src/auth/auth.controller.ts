import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Email/Passwort Registrierung' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Email/Passwort Login' })
  login(@Req() req: any) {
    return this.authService.login(req.user as UserEntity);
  }

  @Post('login/guest')
  @ApiOperation({ summary: 'Gast-Login (temporärer Benutzer)' })
  loginGuest() {
    return this.authService.loginGuest();
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth Redirect' })
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth Callback' })
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.loginGoogle(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  logout(@CurrentUser() user: UserEntity) {
    return this.authService.logout(user.id);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'E-Mail per Token verifizieren' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verifikations-E-Mail erneut senden' })
  resendVerification(@CurrentUser() user: UserEntity) {
    return this.authService.resendVerification(user.id);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Passwort-Reset E-Mail anfordern' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Neues Passwort per Token setzen' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aktuellen User zurückgeben' })
  me(@CurrentUser() user: UserEntity) {
    return user;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'JWT Token erneuern' })
  refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
