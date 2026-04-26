import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { MessageEntity } from '../../messages/entities/message.entity';

@Entity('channels')
export class ChannelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: '' })
  description: string;

  @Column({ default: false })
  defaultChannel: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column()
  creatorID: string;

  @Column({ default: 0 })
  messagesCount: number;

  @ManyToMany(() => UserEntity, (user) => user.channels)
  @JoinTable({ name: 'channel_members' })
  members: UserEntity[];

  @OneToMany(() => MessageEntity, (msg) => msg.channel, { cascade: true })
  messages: MessageEntity[];

  get memberIDs(): string[] {
    return this.members?.map((m) => m.id) ?? [];
  }
}
