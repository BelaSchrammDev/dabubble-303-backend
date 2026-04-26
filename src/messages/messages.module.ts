import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessageEntity } from './entities/message.entity';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity]), GatewayModule],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
