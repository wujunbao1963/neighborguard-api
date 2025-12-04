import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { User } from './users/user.entity';
import { Circle } from './circles/circle.entity';
import { CircleMember } from './circles/circle-member.entity';
import { Event } from './events/event.entity';
import { EventComment } from './events/event-comment.entity';
import { VideoAsset } from './media/video-asset.entity';
import { Notification } from './notifications/notification.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  entities: [
    User,
    Circle,
    CircleMember,
    Event,
    EventComment,
    VideoAsset,
    Notification,
  ],
  migrations: ['migrations/*{.ts,.js}'],
});
