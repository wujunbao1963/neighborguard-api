import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CircleMember } from './circle-member.entity';

@Entity('circles')
export class Circle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @Column({ type: 'text' })
  name!: string;

  // IMPORTANT: explicit type because `string | null` reflects as Object
  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'text', nullable: true })
  inviteCode!: string | null;

  @OneToMany(() => CircleMember, (member) => member.circle)
  members!: CircleMember[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
