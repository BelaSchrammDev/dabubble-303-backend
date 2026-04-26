import {
  Controller,
  Delete,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { UploadsService } from './uploads.service';

function tempStorage() {
  return diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}${extname(file.originalname)}`);
    },
  });
}

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('profile-picture')
  @ApiOperation({ summary: 'Profilbild hochladen' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: tempStorage() }))
  uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserEntity,
  ) {
    return this.uploadsService.saveProfilePicture(user.id, file);
  }

  @Delete('profile-picture/:userId')
  @ApiOperation({ summary: 'Profilbild löschen' })
  deleteProfilePicture(@Param('userId') userId: string) {
    this.uploadsService.deleteProfilePicture(userId);
    return { ok: true };
  }

  @Post('attachment')
  @ApiOperation({ summary: 'Nachricht-Attachment hochladen' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: tempStorage() }))
  uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Query('messageId') messageId: string,
  ) {
    return this.uploadsService.saveAttachment(messageId, file);
  }

  @Delete('attachment')
  @ApiOperation({ summary: 'Attachment löschen (by path)' })
  deleteAttachment(@Query('path') filePath: string) {
    this.uploadsService.deleteAttachment(filePath);
    return { ok: true };
  }
}
