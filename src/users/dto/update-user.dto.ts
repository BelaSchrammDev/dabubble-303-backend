import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LastReadMessage } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  avatar?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pictureURL?: string;
}

export class UpdateOnlineDto {
  @ApiPropertyOptional()
  @IsBoolean()
  online: boolean;
}

export class UpdateLastReadDto {
  @ApiPropertyOptional({ type: () => [Object] })
  @IsOptional()
  lastReadMessages?: LastReadMessage[];
}
