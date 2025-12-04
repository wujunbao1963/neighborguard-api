import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Circle } from '../circles/circle.entity';
import { VideoAsset } from '../media/video-asset.entity';
import { User } from '../users/user.entity';

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum EventStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  circleId: string;

  @ManyToOne(() => Circle, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circleId' })
  circle: Circle;

  @Column({ type: 'varchar', length: 120, nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /**
   * 发起人写的「发生了什么 / 希望邻居帮什么」
   */
  @Column({ type: 'text' })
  requestText: string;

  /**
   * 简单字符串类型，前端自行约定：suspicious_person / package_issue / ...
   */
  @Column({ type: 'varchar', length: 64 })
  eventType: string;

  /**
   * 来自 circle.cameraZonesConfig，如 front-door / driveway / backyard 等
   */
  @Column({ type: 'varchar', length: 64 })
  cameraZone: string;

  @Column({
    type: 'enum',
    enum: EventSeverity,
    default: EventSeverity.MEDIUM,
  })
  severity: EventSeverity;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.OPEN,
  })
  status: EventStatus;

  /**
   * 结案摘要，可以和 resolutionNote 一样，或者更精简
   */
  @Column({ type: 'text', default: '' })
  resolution: string;

  /**
   * 结案说明，由事件发起人 + 圈主有权修改
   */
  @Column({ type: 'text', nullable: true })
  resolutionNote?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  occurredAt?: Date | null;

  @Column({ nullable: true })
  videoAssetId?: string | null;

  @ManyToOne(() => VideoAsset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'videoAssetId' })
  videoAsset?: VideoAsset | null;

  @Column({ nullable: true })
  createdById?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy?: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
