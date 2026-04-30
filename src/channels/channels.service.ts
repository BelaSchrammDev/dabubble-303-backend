import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepo: Repository<ChannelEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly gateway: AppGateway,
  ) {}

  async findAll(): Promise<ChannelEntity[]> {
    return this.channelRepo.find({ relations: ['members'] });
  }

  async findOne(id: string): Promise<ChannelEntity> {
    const channel = await this.channelRepo.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!channel) throw new NotFoundException('Channel nicht gefunden');
    return channel;
  }

  async create(dto: CreateChannelDto, creatorID: string): Promise<ChannelEntity> {
    const memberIds = Array.from(new Set([...dto.memberIDs, creatorID]));
    const members = await this.userRepo.findBy({ id: In(memberIds) });
    const channel = this.channelRepo.create({
      name: dto.name,
      description: dto.description ?? '',
      creatorID,
      members,
    });
    const saved = await this.channelRepo.save(channel);
    this.gateway.broadcastToAll('channel:created', { channel: saved });
    return saved;
  }

  async update(id: string, dto: UpdateChannelDto): Promise<ChannelEntity> {
    const channel = await this.findOne(id);
    if (dto.name !== undefined) channel.name = dto.name;
    if (dto.description !== undefined) channel.description = dto.description;
    if (dto.defaultChannel !== undefined) channel.defaultChannel = dto.defaultChannel;
    if (dto.memberIDs !== undefined) {
      channel.members = await this.userRepo.findBy({ id: In(dto.memberIDs) });
    }
    const saved = await this.channelRepo.save(channel);
    this.gateway.broadcastToAll('channel:updated', { channel: saved });
    return saved;
  }

  async remove(id: string): Promise<void> {
    const channel = await this.findOne(id);
    await this.channelRepo.remove(channel);
    this.gateway.broadcastToAll('channel:deleted', { channelId: id });
  }
}
