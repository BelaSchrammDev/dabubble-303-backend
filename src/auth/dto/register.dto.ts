import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Max Mustermann' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'max@example.de' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'sicheresPasswort123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'max@example.de' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'sicheresPasswort123' })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'max@example.de' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'neuesPasswort123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}
