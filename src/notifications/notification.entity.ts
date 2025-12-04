// src/notifications/notification.entity.ts
import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  EVENT_CREATED = 'event_created',
  EVENT_RESOLVED = 'event_resolved',
}

@Index(['userId', 'isRead', 'createdAt'])
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 64 })
  type: NotificationType;

  @Column({ type: 'simple-json', nullable: true })
  payload?: any;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
