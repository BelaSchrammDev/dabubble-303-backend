import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  UpdateDateColumn,
} from 'typeorm';
import { ChatEntity } from '../../chats/entities/chat.entity';
import { ChannelEntity } from '../../channels/entities/channel.entity';

export type AuthProvider = 'email' | 'google' | 'guest';
export type CollectionType = 'channel' | 'chat' | 'message';

export interface LastReadMessage {
  collectionType: CollectionType;
  collectionID: string;
  messageID: string;
  messageCreateAt: number;
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  passwordHash: string;

  @Column({ default: 1 })
  avatar: number;

  @Column({ nullable: true })
  pictureURL: string;

  @Column({ default: false })
  online: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true, type: 'timestamptz' })
  passwordResetTokenExpiry: Date;

  @Column({ type: 'varchar', default: 'email' })
  provider: AuthProvider;

  @Column({ default: false })
  guest: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  signupAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'jsonb', default: '[]' })
  lastReadMessages: LastReadMessage[];

  @ManyToMany(() => ChatEntity, (chat) => chat.members)
  chats: ChatEntity[];

  @ManyToMany(() => ChannelEntity, (channel) => channel.members)
  channels: ChannelEntity[];
}
