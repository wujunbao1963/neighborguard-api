import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaService } from './media.service';
import { UploadVideoResponseDto } from './dto/upload-video-response.dto';
import { UPLOADS_DIR } from '../common/paths';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);
const ALLOWED_VIDEO_EXT = new Set(['.mp4', '.mov', '.webm']);

const videoFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: any, acceptFile: boolean) => void,
) => {
  const ext = extname(file.originalname).toLowerCase();
  if (ALLOWED_VIDEO_MIME.has(file.mimetype) && ALLOWED_VIDEO_EXT.has(ext)) {
    return cb(null, true);
  }
  return cb(
    new UnsupportedMediaTypeException(
      `Unsupported file type: ${file.mimetype} (${ext}). Allowed: mp4, mov, webm.`,
    ) as any,
    false,
  );
};

// 定义存储策略：保存到 ./uploads 目录
const storage = diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

@Controller('upload')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: MAX_VIDEO_BYTES },
      fileFilter: videoFileFilter,
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadVideoResponseDto> {
    if (!file) throw new BadRequestException('file is required');
    return this.mediaService.handleVideoUpload(file);
  }
}
