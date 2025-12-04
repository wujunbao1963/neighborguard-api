import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoAsset } from './video-asset.entity';
import { UploadVideoResponseDto } from './dto/upload-video-response.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(VideoAsset)
    private readonly videoAssetsRepo: Repository<VideoAsset>,
  ) {}

  async handleVideoUpload(
    file: Express.Multer.File,
  ): Promise<UploadVideoResponseDto> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // 这里假设你后面会用 ServeStaticModule 把 /uploads 暴露成静态目录
    const publicUrl = `/uploads/${file.filename}`;

    const asset = this.videoAssetsRepo.create({
      url: publicUrl,
      storagePath: file.path,
    });

    await this.videoAssetsRepo.save(asset);

    return {
      videoAssetId: asset.id,
      url: asset.url,
    };
  }
}
