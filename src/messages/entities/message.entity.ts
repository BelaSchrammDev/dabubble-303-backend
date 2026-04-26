import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ChannelEntity } from '../../channels/entities/channel.entity';
import { ChatEntity } from '../../chats/entities/chat.entity';

export interface IReaction {
  type: string;
  userIDs: string[];
}

export interface StoredAttachment {
  name: string;
  type: 'image' | 'pdf';
  url: string;
  path: string;
}

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  creatorID: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', default: '' })
  plainContent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: false })
  edited: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  editedAt: Date;

  @Column({ default: true })
  answerable: boolean;

  @Column({ default: 0 })
  answerCount: number;

  @Column({ nullable: true, type: 'timestamptz' })
  lastAnswerAt: Date;

  @Column({ type: 'jsonb', default: '[]' })
  emojies: IReaction[];

  @Column({ type: 'jsonb', nullable: true })
  attachments: StoredAttachment[];

  @ManyToOne(() => ChannelEntity, (channel) => channel.messages, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: ChannelEntity;

  @Column({ nullable: true })
  channelId: string;

  @ManyToOne(() => ChatEntity, (chat) => chat.messages, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chatId' })
  chat: ChatEntity;

  @Column({ nullable: true })
  chatId: string;

  @ManyToOne(() => MessageEntity, (msg) => msg.answers, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentMessageId' })
  parentMessage: MessageEntity;

  @Column({ nullable: true })
  parentMessageId: string;

  @OneToMany(() => MessageEntity, (msg) => msg.parentMessage, { cascade: true })
  answers: MessageEntity[];
}
