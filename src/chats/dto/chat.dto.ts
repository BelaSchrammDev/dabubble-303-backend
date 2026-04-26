import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({ description: 'ID des Gesprächspartners (oder eigene ID für Self-Chat)' })
  @IsString()
  partnerUserId: string;
}
