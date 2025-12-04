import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './users/user.entity';
import { Circle } from './circles/circle.entity';
import { CircleMember } from './circles/circle-member.entity';
import { Event } from './events/event.entity';
import { EventComment } from './events/event-comment.entity';
import { VideoAsset } from './media/video-asset.entity';
import { Notification } from './notifications/notification.entity';

// Load environment variables
config();

// Railway provides DATABASE_URL, fallback to individual variables for local dev
const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  databaseUrl
    ? {
        // Railway PostgreSQL connection
        type: 'postgres',
        url: databaseUrl,
        ssl: {
          rejectUnauthorized: false,
        },
        entities: [
          User,
          Circle,
          CircleMember,
          Event,
          EventComment,
          VideoAsset,
          Notification,
        ],
        migrations: ['src/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }
    : {
        // Local development connection
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
        migrations: ['src/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: true,
      }
);

export default AppDataSource;
