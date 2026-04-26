import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MessageEntity } from '../messages/entities/message.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ChannelEntity } from '../channels/entities/channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity, UserEntity, ChannelEntity])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
