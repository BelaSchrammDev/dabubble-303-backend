import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { MessageEntity } from '../messages/entities/message.entity';
import { UserEntity } from '../users/entities/user.entity';
import { ChannelEntity } from '../channels/entities/channel.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ChannelEntity)
    private readonly channelRepo: Repository<ChannelEntity>,
  ) {}

  async searchGlobal(q: string) {
    const term = `%${q}%`;
    const [messages, users, channels] = await Promise.all([
      this.messageRepo.find({
        where: { plainContent: ILike(term) },
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.userRepo.find({
        where: { name: ILike(term) },
        take: 20,
      }),
      this.channelRepo.find({
        where: { name: ILike(term) },
        take: 20,
      }),
    ]);
    return { messages, users, channels };
  }

  async searchMessages(q: string, channelId?: string, chatId?: string): Promise<MessageEntity[]> {
    const term = `%${q}%`;
    const where: any = { plainContent: ILike(term), parentMessageId: IsNull() };
    if (channelId) where.channelId = channelId;
    if (chatId) where.chatId = chatId;
    return this.messageRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }
}
