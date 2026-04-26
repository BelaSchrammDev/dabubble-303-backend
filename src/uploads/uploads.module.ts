import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UserEntity } from '../users/entities/user.entity';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), GatewayModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
