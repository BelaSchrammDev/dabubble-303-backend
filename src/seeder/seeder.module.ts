import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { UserEntity } from '../users/entities/user.entity';
import { ChannelEntity } from '../channels/entities/channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ChannelEntity])],
  providers: [SeederService],
})
export class SeederModule {}
