import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, LastReadMessage } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly gateway: AppGateway,
  ) {}

  async findAll(): Promise<UserEntity[]> {
    return this.userRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Benutzer nicht gefunden');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requesterId: string): Promise<UserEntity> {
    if (id !== requesterId) throw new ForbiddenException('Keine Berechtigung');
    await this.userRepo.update(id, dto);
    const updated = await this.findOne(id);
    this.gateway.broadcastToAll('user:updated', { user: updated });
    return updated;
  }

  async setOnline(id: string, online: boolean): Promise<void> {
    await this.userRepo.update(id, { online });
    this.gateway.broadcastUserStatus(id, online);
  }

  async updateLastRead(id: string, lastReadMessages: LastReadMessage[]): Promise<void> {
    await this.userRepo.update(id, { lastReadMessages });
  }

  async remove(id: string, requesterId: string): Promise<void> {
    const user = await this.findOne(id);
    if (id !== requesterId) throw new ForbiddenException('Keine Berechtigung');
    await this.userRepo.remove(user);
  }
}
