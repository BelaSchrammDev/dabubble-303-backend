import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ChannelEntity } from '../channels/entities/channel.entity';
import { ChatEntity } from '../chats/entities/chat.entity';
import { MessageEntity } from '../messages/entities/message.entity';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'dabubble',
    username: process.env.DATABASE_USER || 'dabubble',
    password: process.env.DATABASE_PASSWORD || 'dabubble',
    entities: [UserEntity, ChannelEntity, ChatEntity, MessageEntity],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  };
}
