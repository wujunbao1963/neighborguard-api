import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../users/user.entity';
import { Circle } from '../circles/circle.entity';

export enum EventCommentType {
  COMMENT = 'comment',
  SYSTEM = 'system',
}

@Entity('event_comments')
export class EventComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  circleId: string;

  @Column()
  userId: string;

  // ✅ 真正存评论内容的字段，统一叫 body
  @Column('text')
  body: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: EventCommentType.COMMENT,
  })
  type: EventCommentType;

  @ManyToOne(() => Event, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => Circle, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'circleId' })
  circle: Circle;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
