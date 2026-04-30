import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MessageEntity, IReaction } from './entities/message.entity';
import { CreateMessageDto, UpdateMessageDto } from './dto/message.dto';
import { AppGateway } from '../gateway/app.gateway';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    private readonly gateway: AppGateway,
  ) {}

  async findByChannel(channelId: string, limit: number, offset: number): Promise<{ messages: MessageEntity[]; total: number }> {
    const total = await this.messageRepo.count({
      where: { channelId, parentMessageId: IsNull() },
    });
    const rows = await this.messageRepo.find({
      where: { channelId, parentMessageId: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { messages: rows.reverse(), total };
  }

  async findByChat(chatId: string, limit: number, offset: number): Promise<{ messages: MessageEntity[]; total: number }> {
    const total = await this.messageRepo.count({
      where: { chatId, parentMessageId: IsNull() },
    });
    const rows = await this.messageRepo.find({
      where: { chatId, parentMessageId: IsNull() },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { messages: rows.reverse(), total };
  }

  async findAnswers(parentMessageId: string): Promise<MessageEntity[]> {
    return this.messageRepo.find({
      where: { parentMessageId },
      order: { createdAt: 'ASC' },
    });
  }

  async createChannelMessage(
    channelId: string,
    dto: CreateMessageDto,
    creatorID: string,
  ): Promise<MessageEntity> {
    const msg = this.messageRepo.create({
      channelId,
      creatorID,
      content: dto.content,
      plainContent: dto.plainContent ?? stripHtml(dto.content),
      answerable: dto.answerable ?? true,
    });
    const saved = await this.messageRepo.save(msg);
    this.gateway.broadcastToChannel(channelId, 'channel-message:created', {
      channelId,
      message: saved,
    });
    return saved;
  }

  async createChatMessage(
    chatId: string,
    dto: CreateMessageDto,
    creatorID: string,
  ): Promise<MessageEntity> {
    const msg = this.messageRepo.create({
      chatId,
      creatorID,
      content: dto.content,
      plainContent: dto.plainContent ?? stripHtml(dto.content),
      answerable: dto.answerable ?? true,
    });
    const saved = await this.messageRepo.save(msg);
    this.gateway.broadcastToChat(chatId, 'chat-message:created', {
      chatId,
      message: saved,
    });
    return saved;
  }

  async createAnswer(
    parentMessageId: string,
    dto: CreateMessageDto,
    creatorID: string,
    channelId?: string,
    chatId?: string,
  ): Promise<MessageEntity> {
    const parent = await this.messageRepo.findOne({ where: { id: parentMessageId } });
    if (!parent) throw new NotFoundException('Nachricht nicht gefunden');

    const answer = this.messageRepo.create({
      parentMessageId,
      channelId: channelId ?? parent.channelId,
      chatId: chatId ?? parent.chatId,
      creatorID,
      content: dto.content,
      plainContent: dto.plainContent ?? stripHtml(dto.content),
      answerable: false,
    });
    const saved = await this.messageRepo.save(answer);

    // Aktualisiere answerCount und lastAnswerAt auf der Parent-Message
    const count = await this.messageRepo.count({ where: { parentMessageId } });
    await this.messageRepo.update(parentMessageId, {
      answerCount: count,
      lastAnswerAt: new Date(),
    });

    // Broadcast
    const resolvedChannelId = channelId ?? parent.channelId;
    const resolvedChatId = chatId ?? parent.chatId;
    if (resolvedChannelId) {
      this.gateway.broadcastToChannel(resolvedChannelId, 'channel-answer:created', {
        channelId: resolvedChannelId,
        parentMessageId,
        message: saved,
      });
    } else if (resolvedChatId) {
      this.gateway.broadcastToChat(resolvedChatId, 'chat-answer:created', {
        chatId: resolvedChatId,
        parentMessageId,
        message: saved,
      });
    }
    return saved;
  }

  async update(
    id: string,
    dto: UpdateMessageDto,
    requesterId: string,
  ): Promise<MessageEntity> {
    const msg = await this.messageRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Nachricht nicht gefunden');
    if (msg.creatorID !== requesterId) throw new ForbiddenException('Keine Berechtigung');

    msg.content = dto.content;
    msg.plainContent = dto.plainContent ?? stripHtml(dto.content);
    msg.edited = true;
    msg.editedAt = new Date();
    const saved = await this.messageRepo.save(msg);

    if (msg.channelId) {
      this.gateway.broadcastToChannel(msg.channelId, 'channel-message:updated', {
        channelId: msg.channelId,
        message: saved,
      });
    } else if (msg.chatId) {
      this.gateway.broadcastToChat(msg.chatId, 'chat-message:updated', {
        chatId: msg.chatId,
        message: saved,
      });
    }
    return saved;
  }

  async remove(
    id: string,
    requesterId: string,
    channelId?: string,
    chatId?: string,
  ): Promise<void> {
    const msg = await this.messageRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Nachricht nicht gefunden');
    if (msg.creatorID !== requesterId) throw new ForbiddenException('Keine Berechtigung');

    const resolvedChannelId = channelId ?? msg.channelId;
    const resolvedChatId = chatId ?? msg.chatId;

    await this.messageRepo.remove(msg);

    if (resolvedChannelId) {
      this.gateway.broadcastToChannel(resolvedChannelId, 'channel-message:deleted', {
        channelId: resolvedChannelId,
        messageId: id,
      });
    } else if (resolvedChatId) {
      this.gateway.broadcastToChat(resolvedChatId, 'chat-message:deleted', {
        chatId: resolvedChatId,
        messageId: id,
      });
    }
  }

  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string,
    channelId?: string,
    chatId?: string,
  ): Promise<MessageEntity> {
    const msg = await this.messageRepo.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Nachricht nicht gefunden');

    const reactions: IReaction[] = msg.emojies || [];
    const existing = reactions.find((r) => r.type === emoji);
    if (existing) {
      if (existing.userIDs.includes(userId)) {
        existing.userIDs = existing.userIDs.filter((id) => id !== userId);
        if (existing.userIDs.length === 0) {
          msg.emojies = reactions.filter((r) => r.type !== emoji);
        } else {
          msg.emojies = reactions;
        }
      } else {
        existing.userIDs.push(userId);
        msg.emojies = reactions;
      }
    } else {
      msg.emojies = [...reactions, { type: emoji, userIDs: [userId] }];
    }

    const saved = await this.messageRepo.save(msg);
    const resolvedChannelId = channelId ?? msg.channelId;
    const resolvedChatId = chatId ?? msg.chatId;

    if (resolvedChannelId) {
      this.gateway.broadcastToChannel(resolvedChannelId, 'channel-message:reaction', {
        channelId: resolvedChannelId,
        messageId,
        emojies: saved.emojies,
      });
    } else if (resolvedChatId) {
      this.gateway.broadcastToChat(resolvedChatId, 'chat-message:reaction', {
        chatId: resolvedChatId,
        messageId,
        emojies: saved.emojies,
      });
    }
    return saved;
  }
}
