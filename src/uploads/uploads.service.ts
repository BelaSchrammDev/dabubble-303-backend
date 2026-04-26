import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { UserEntity } from '../users/entities/user.entity';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly gateway: AppGateway,
  ) {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  }

  getPublicUrl(relativePath: string): string {
    const base = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${base}/uploads/${relativePath}`;
  }

  async saveProfilePicture(userId: string, file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname);
    const filename = `${userId}${ext}`;
    const dest = path.join(this.uploadDir, 'profile-pictures', filename);
    fs.renameSync(file.path, dest);
    const url = this.getPublicUrl(`profile-pictures/${filename}`);
    await this.userRepo.update(userId, { pictureURL: url });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) this.gateway.broadcastToAll('user:updated', { user });
    return url;
  }

  deleteProfilePicture(userId: string): void {
    const dir = path.join(this.uploadDir, 'profile-pictures');
    for (const ext of ['.jpg', '.jpeg', '.png', '.gif', '.webp']) {
      const filePath = path.join(dir, `${userId}${ext}`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  saveAttachment(
    messageId: string,
    file: Express.Multer.File,
  ): { name: string; url: string; path: string; type: 'image' | 'pdf' } {
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const filename = `${file.originalname}`;
    const dir = path.join(this.uploadDir, 'message-attachments', messageId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, filename);
    fs.renameSync(file.path, dest);
    const relativePath = `message-attachments/${messageId}/${filename}`;
    const url = this.getPublicUrl(relativePath);
    const type = file.mimetype.startsWith('image') ? 'image' : 'pdf';
    return { name: nameWithoutExt, url, path: relativePath, type };
  }

  deleteAttachment(relativePath: string): void {
    const fullPath = path.join(this.uploadDir, relativePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
