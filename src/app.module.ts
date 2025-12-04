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

        const dbSsl = config.get<boolean>('DB_SSL') ?? false;

        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,

          // env-controlled knobs (default safe in prod)
          synchronize: config.get<boolean>('DB_SYNCHRONIZE') ?? !isProd,
          logging: config.get<boolean>('DB_LOGGING') ?? !isProd,

          // tests: start clean
          dropSchema: isTest,

          // hosted postgres often needs SSL
          ssl: dbSsl ? { rejectUnauthorized: false } : false,

          // prod: run migrations on boot (optional but common)
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
  ],

  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CurrentUserInterceptor,
    },
  ],
})
export class AppModule {}

