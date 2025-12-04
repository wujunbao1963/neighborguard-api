import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('video_assets')
export class VideoAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 前端可访问的视频 URL
  @Column()
  url: string;

  // 本地/云存储路径（可选）
  @Column({ nullable: true })
  storagePath?: string;

  @Column({ type: 'int', nullable: true })
  durationSec?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
