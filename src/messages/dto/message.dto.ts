import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: '<p>Hallo!</p>' })
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plainContent?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  answerable?: boolean;
}

export class UpdateMessageDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plainContent?: string;
}
