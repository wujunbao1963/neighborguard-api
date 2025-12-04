import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

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
        // Automatically discover all entities
        entities: ['dist/**/*.entity.js'],
        migrations: ['dist/migrations/*{.js}'],
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
        // Automatically discover all entities
        entities: ['src/**/*.entity.ts'],
        migrations: ['src/migrations/*{.ts}'],
        synchronize: false,
        logging: true,
      }
);

export default AppDataSource;
