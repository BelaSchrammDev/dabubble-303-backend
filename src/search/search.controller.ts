import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global suchen (Users, Channels, Messages)' })
  searchGlobal(@Query('q') q: string) {
    return this.searchService.searchGlobal(q || '');
  }

  @Get('messages')
  @ApiOperation({ summary: 'Messages suchen (optional: channelId oder chatId)' })
  searchMessages(
    @Query('q') q: string,
    @Query('channelId') channelId?: string,
    @Query('chatId') chatId?: string,
  ) {
    return this.searchService.searchMessages(q || '', channelId, chatId);
  }
}
