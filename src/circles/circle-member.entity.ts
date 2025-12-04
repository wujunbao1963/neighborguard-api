import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Circle } from './circle.entity';
import { User } from '../users/user.entity';

export enum MemberRole {
  OWNER = 'owner',
  RESIDENT = 'resident',
  NEIGHBOR = 'neighbor',
  OBSERVER = 'observer',
}

@Entity('circle_members')
export class CircleMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  circleId: string;

  @ManyToOne(() => Circle, (circle) => circle.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'circleId' })
  circle: Circle;

  @Column()
  userId: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', default: MemberRole.RESIDENT })
  role: MemberRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
