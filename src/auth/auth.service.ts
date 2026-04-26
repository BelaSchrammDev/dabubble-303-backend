import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mail/mail.service';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly gateway: AppGateway,
  ) {}

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
    if (!user || !user.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  generateTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET || 'default_secret_change_me',
        expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
      }),
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('E-Mail bereits registriert');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = uuidv4();

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      provider: 'email',
      emailVerificationToken: verificationToken,
      emailVerified: false,
    });
    await this.userRepo.save(user);

    await this.mailService.sendVerificationEmail(user.email, user.name, verificationToken);
    return { message: 'Registrierung erfolgreich. Bitte E-Mail bestätigen.' };
  }

  private sanitizeUser(user: UserEntity) {
    const { passwordHash, emailVerificationToken, passwordResetToken, passwordResetTokenExpiry, ...safe } = user as any;
    return safe;
  }

  async login(user: UserEntity) {
    await this.userRepo.update(user.id, { online: true });
    this.gateway.broadcastUserStatus(user.id, true);
    return { ...this.generateTokens(user), user: this.sanitizeUser(user) };
  }

  async loginGuest() {
    const email = `gast${Date.now()}@gast.de`;
    const userEntity = this.userRepo.create({
      name: 'Gast',
      email,
      provider: 'guest',
      guest: true,
      emailVerified: true,
      online: true,
    });
    await this.userRepo.save(userEntity);
    return { ...this.generateTokens(userEntity), user: this.sanitizeUser(userEntity) };
  }

  async loginGoogle(profile: {
    email: string;
    name: string;
    pictureURL: string | null;
    provider: 'google';
  }) {
    let user = await this.userRepo.findOne({ where: { email: profile.email } });
    if (!user) {
      user = this.userRepo.create({
        name: profile.name,
        email: profile.email,
        pictureURL: profile.pictureURL ?? undefined,
        provider: 'google',
        emailVerified: true,
        online: true,
      });
      await this.userRepo.save(user);
    }
    await this.userRepo.update(user.id, { online: true });
    this.gateway.broadcastUserStatus(user.id, true);
    return { ...this.generateTokens(user), user: this.sanitizeUser(user) };
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { online: false });
    this.gateway.broadcastUserStatus(userId, false);
    return { message: 'Ausgeloggt' };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findOne({
      where: { emailVerificationToken: token },
    });
    if (!user) throw new BadRequestException('Ungültiger Verifikations-Token');
    await this.userRepo.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null as any,
    });
    return { message: 'E-Mail erfolgreich bestätigt' };
  }

  async resendVerification(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Benutzer nicht gefunden');
    if (user.emailVerified) throw new BadRequestException('E-Mail bereits bestätigt');
    const token = uuidv4();
    await this.userRepo.update(userId, { emailVerificationToken: token });
    await this.mailService.sendVerificationEmail(user.email, user.name, token);
    return { message: 'Verifikations-E-Mail erneut gesendet' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return { message: 'Falls die E-Mail existiert, wurde eine Nachricht gesendet' };
    const token = uuidv4();
    const expiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 Stunden
    await this.userRepo.update(user.id, {
      passwordResetToken: token,
      passwordResetTokenExpiry: expiry,
    });
    await this.mailService.sendPasswordResetEmail(user.email, user.name, token);
    return { message: 'Falls die E-Mail existiert, wurde eine Nachricht gesendet' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetTokenExpiry) {
      throw new BadRequestException('Ungültiger oder abgelaufener Token');
    }
    if (user.passwordResetTokenExpiry < new Date()) {
      throw new BadRequestException('Token abgelaufen');
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(user.id, {
      passwordHash,
      passwordResetToken: null as any,
      passwordResetTokenExpiry: null as any,
    });
    return { message: 'Passwort erfolgreich geändert' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Ungültiger Refresh-Token');
    }
  }
}
