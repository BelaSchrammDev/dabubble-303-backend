import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { GatewayModule } from './gateway/gateway.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChannelsModule } from './channels/channels.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { UploadsModule } from './uploads/uploads.module';
import { SearchModule } from './search/search.module';
import { MailModule } from './mail/mail.module';
import { SeederModule } from './seeder/seeder.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    GatewayModule,
    AuthModule,
    UsersModule,
    ChannelsModule,
    ChatsModule,
    MessagesModule,
    UploadsModule,
    SearchModule,
    MailModule,
    SeederModule,
  ],
})
export class AppModule {}
