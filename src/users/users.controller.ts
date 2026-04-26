import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import {
  UpdateLastReadDto,
  UpdateOnlineDto,
  UpdateUserDto,
} from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Alle User abrufen' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Einzelnen User abrufen' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Profil aktualisieren (name, avatar, pictureURL)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.usersService.update(id, dto, user.id);
  }

  @Patch(':id/online')
  @ApiOperation({ summary: 'Online-Status setzen' })
  async setOnline(
    @Param('id') id: string,
    @Body() dto: UpdateOnlineDto,
  ) {
    await this.usersService.setOnline(id, dto.online);
    return { ok: true };
  }

  @Patch(':id/last-read')
  @ApiOperation({ summary: 'lastReadMessages aktualisieren' })
  async updateLastRead(
    @Param('id') id: string,
    @Body() dto: UpdateLastReadDto,
    @CurrentUser() user: UserEntity,
  ) {
    if (dto.lastReadMessages) {
      await this.usersService.updateLastRead(user.id, dto.lastReadMessages);
    }
    return { ok: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'User löschen (z.B. Guest-Logout)' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    await this.usersService.remove(id, user.id);
    return { ok: true };
  }
}
