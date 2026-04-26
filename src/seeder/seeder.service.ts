import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ChannelEntity } from '../channels/entities/channel.entity';

// Feste UUID für den DABubble-Bot
export const DABUBBLE_BOT_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(ChannelEntity)
    private readonly channelRepo: Repository<ChannelEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedBot();
    await this.seedDefaultChannel();
  }

  private async seedBot() {
    const existing = await this.userRepo.findOne({ where: { id: DABUBBLE_BOT_ID } });
    if (existing) return;

    // TypeORM unterstützt keine direkte ID-Setzung bei uuid PK über create()
    // Wir nutzen query builder für die feste ID
    await this.userRepo
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values({
        id: DABUBBLE_BOT_ID,
        name: 'DABubble Bot',
        email: 'bot@dabubble.de',
        provider: 'email',
        emailVerified: true,
        online: false,
        avatar: 0,
      })
      .orIgnore()
      .execute();

    this.logger.log('DABubble-Bot angelegt');
  }

  private async seedDefaultChannel() {
    const existing = await this.channelRepo.findOne({ where: { defaultChannel: true } });
    if (existing) return;

    const bot = await this.userRepo.findOne({ where: { id: DABUBBLE_BOT_ID } });
    const channel = this.channelRepo.create({
      name: 'Allgemein',
      description: 'Der allgemeine Kanal für alle Mitglieder',
      defaultChannel: true,
      creatorID: DABUBBLE_BOT_ID,
      members: bot ? [bot] : [],
    });
    await this.channelRepo.save(channel);
    this.logger.log('Default-Channel "Allgemein" angelegt');
  }
}
