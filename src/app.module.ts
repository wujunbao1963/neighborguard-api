// src/app.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventsModule } from './events/events.module';
import { MediaModule } from './media/media.module';
import { UsersModule } from './users/users.module';
import { CirclesModule } from './circles/circles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HomeModule } from './home/home.module';
import { HealthModule } from './health/health.module';
import { envValidationSchema } from './config/env.validation';
import { CurrentUserInterceptor } from './auth/current-user.interceptor';
import { DeviceTokensModule } from './device-tokens/device-tokens.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('NODE_ENV') ?? 'development';
        const isProd = env === 'production';
        const isTest = env === 'test';
        
        // Railway provides DATABASE_URL automatically
        const databaseUrl = config.get<string>('DATABASE_URL');
        
        // If DATABASE_URL exists (Railway), use it
        // Otherwise fall back to individual DB_* variables (local development)
        if (databaseUrl) {
          console.log('Using DATABASE_URL from Railway PostgreSQL');
          return {
            type: 'postgres',
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: config.get<boolean>('DB_SYNCHRONIZE') ?? !isProd,
            logging: config.get<boolean>('DB_LOGGING') ?? !isProd,
            dropSchema: isTest,
            ssl: {
              rejectUnauthorized: false, // Required for Railway PostgreSQL
            },
            migrationsRun: isProd,
            migrations: [join(__dirname, 'migrations', '*{.js,.ts}')],
            migrationsTableName: 'typeorm_migrations',
          };
        }
        
        // Fallback for local development with individual DB variables
        console.log('Using individual DB_* environment variables');
        const dbSsl = config.get<boolean>('DB_SSL') ?? false;
        
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: config.get<boolean>('DB_SYNCHRONIZE') ?? !isProd,
          logging: config.get<boolean>('DB_LOGGING') ?? !isProd,
          dropSchema: isTest,
          ssl: dbSsl ? { rejectUnauthorized: false } : false,
          migrationsRun: isProd,
          migrations: [join(__dirname, 'migrations', '*{.js,.ts}')],
          migrationsTableName: 'typeorm_migrations',
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    EventsModule,
    MediaModule,
    UsersModule,
    CirclesModule,
    NotificationsModule,
    HomeModule,
    HealthModule,
    DeviceTokensModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CurrentUserInterceptor,
    },
  ],
})
export class AppModule {}
