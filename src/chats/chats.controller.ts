import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/chat.dto';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto, UpdateMessageDto } from '../messages/dto/message.dto';

@ApiTags('chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Alle Chats des aktuellen Users' })
  findAll(@CurrentUser() user: UserEntity) {
    return this.chatsService.findAllForUser(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Chat erstellen oder abrufen (mit partnerUserId)' })
  create(@Body() dto: CreateChatDto, @CurrentUser() user: UserEntity) {
    return this.chatsService.findOrCreate(user.id, dto.partnerUserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelnen Chat abrufen' })
  findOne(@Param('id') id: string) {
    return this.chatsService.findOne(id);
  }

  // --- Messages ---

  @Get(':id/messages')
  @ApiOperation({ summary: 'Chat-Messages abrufen' })
  getMessages(@Param('id') chatId: string) {
    return this.messagesService.findByChat(chatId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Nachricht in Chat senden' })
  createMessage(
    @Param('id') chatId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.createChatMessage(chatId, dto, user.id);
  }

  @Patch(':id/messages/:msgId')
  @ApiOperation({ summary: 'Chat-Message editieren' })
  updateMessage(
    @Param('msgId') msgId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.update(msgId, dto, user.id);
  }

  @Delete(':id/messages/:msgId')
  @ApiOperation({ summary: 'Chat-Message löschen' })
  async deleteMessage(
    @Param('id') chatId: string,
    @Param('msgId') msgId: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.messagesService.remove(msgId, user.id, undefined, chatId);
    return { ok: true };
  }

  @Post(':id/messages/:msgId/reactions')
  @ApiOperation({ summary: 'Emoji-Reaction toggling' })
  toggleReaction(
    @Param('id') chatId: string,
    @Param('msgId') msgId: string,
    @Body('emoji') emoji: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.toggleReaction(msgId, emoji, user.id, undefined, chatId);
  }

  @Get(':id/messages/:msgId/answers')
  @ApiOperation({ summary: 'Thread-Antworten abrufen' })
  getAnswers(@Param('msgId') msgId: string) {
    return this.messagesService.findAnswers(msgId);
  }

  @Post(':id/messages/:msgId/answers')
  @ApiOperation({ summary: 'Thread-Antwort senden' })
  createAnswer(
    @Param('id') chatId: string,
    @Param('msgId') parentMsgId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.createAnswer(parentMsgId, dto, user.id, undefined, chatId);
  }

  @Patch(':id/messages/:msgId/answers/:answerId')
  @ApiOperation({ summary: 'Antwort editieren' })
  updateAnswer(
    @Param('answerId') answerId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.update(answerId, dto, user.id);
  }

  @Delete(':id/messages/:msgId/answers/:answerId')
  @ApiOperation({ summary: 'Antwort löschen' })
  async deleteAnswer(
    @Param('id') chatId: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.messagesService.remove(answerId, user.id, undefined, chatId);
    return { ok: true };
  }
}
