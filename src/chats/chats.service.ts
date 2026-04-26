import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatEntity } from './entities/chat.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly chatRepo: Repository<ChatEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly gateway: AppGateway,
  ) {}

  async findAllForUser(userId: string): Promise<ChatEntity[]> {
    return this.chatRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.members', 'member')
      .where('member.id = :userId', { userId })
      .getMany();
  }

  async findOne(id: string): Promise<ChatEntity> {
    const chat = await this.chatRepo.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!chat) throw new NotFoundException('Chat nicht gefunden');
    return chat;
  }

  async findOrCreate(currentUserId: string, partnerUserId: string): Promise<ChatEntity> {
    // Prüfe ob Chat bereits existiert
    const existing = await this.chatRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.members', 'member')
      .where((qb) => {
        const sub1 = qb.subQuery()
          .select('c.id').from(ChatEntity, 'c')
          .innerJoin('c.members', 'm1', 'm1.id = :u1')
          .getQuery();
        const sub2 = qb.subQuery()
          .select('c.id').from(ChatEntity, 'c')
          .innerJoin('c.members', 'm2', 'm2.id = :u2')
          .getQuery();
        return `chat.id IN ${sub1} AND chat.id IN ${sub2}`;
      })
      .setParameters({ u1: currentUserId, u2: partnerUserId })
      .getOne();

    if (existing) return existing;

    const members = await this.userRepo.findBy({
      id: In([currentUserId, partnerUserId]),
    });
    const chat = this.chatRepo.create({ members });
    const saved = await this.chatRepo.save(chat);
    this.gateway.broadcastToAll('chat:created', { chat: saved });
    return saved;
  }
}
