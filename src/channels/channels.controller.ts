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
import { ChannelsService } from './channels.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/channel.dto';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto, UpdateMessageDto } from '../messages/dto/message.dto';

@ApiTags('channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(
    private readonly channelsService: ChannelsService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Alle Channels abrufen' })
  findAll() {
    return this.channelsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Channel erstellen' })
  create(@Body() dto: CreateChannelDto, @CurrentUser() user: UserEntity) {
    return this.channelsService.create(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelnen Channel abrufen' })
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Channel aktualisieren' })
  update(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    return this.channelsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Channel löschen' })
  async remove(@Param('id') id: string) {
    await this.channelsService.remove(id);
    return { ok: true };
  }

  // --- Messages ---

  @Get(':id/messages')
  @ApiOperation({ summary: 'Channel-Messages abrufen' })
  getMessages(@Param('id') id: string) {
    return this.messagesService.findByChannel(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Nachricht in Channel senden' })
  createMessage(
    @Param('id') channelId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.createChannelMessage(channelId, dto, user.id);
  }

  @Patch(':id/messages/:msgId')
  @ApiOperation({ summary: 'Channel-Message editieren' })
  updateMessage(
    @Param('msgId') msgId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.update(msgId, dto, user.id);
  }

  @Delete(':id/messages/:msgId')
  @ApiOperation({ summary: 'Channel-Message löschen' })
  async deleteMessage(
    @Param('id') channelId: string,
    @Param('msgId') msgId: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.messagesService.remove(msgId, user.id, channelId, undefined);
    return { ok: true };
  }

  @Post(':id/messages/:msgId/reactions')
  @ApiOperation({ summary: 'Emoji-Reaction toggling' })
  toggleReaction(
    @Param('id') channelId: string,
    @Param('msgId') msgId: string,
    @Body('emoji') emoji: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.toggleReaction(msgId, emoji, user.id, channelId, undefined);
  }

  @Get(':id/messages/:msgId/answers')
  @ApiOperation({ summary: 'Thread-Antworten abrufen' })
  getAnswers(@Param('msgId') msgId: string) {
    return this.messagesService.findAnswers(msgId);
  }

  @Post(':id/messages/:msgId/answers')
  @ApiOperation({ summary: 'Thread-Antwort senden' })
  createAnswer(
    @Param('id') channelId: string,
    @Param('msgId') parentMsgId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.messagesService.createAnswer(parentMsgId, dto, user.id, channelId, undefined);
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
    @Param('id') channelId: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: UserEntity,
  ) {
    await this.messagesService.remove(answerId, user.id, channelId, undefined);
    return { ok: true };
  }
}
