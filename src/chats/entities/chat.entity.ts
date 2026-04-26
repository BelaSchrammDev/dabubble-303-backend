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

@Entity('chats')
export class ChatEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: 0 })
  messagesCount: number;

  @ManyToMany(() => UserEntity, (user) => user.chats)
  @JoinTable({ name: 'chat_members' })
  members: UserEntity[];

  @OneToMany(() => MessageEntity, (msg) => msg.chat, { cascade: true })
  messages: MessageEntity[];

  get memberIDs(): string[] {
    return this.members?.map((m) => m.id) ?? [];
  }
}
