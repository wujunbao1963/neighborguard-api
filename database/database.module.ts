import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';

/**
 * Database configuration module
 * Handles TypeORM setup and database connections
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const env = configService.get<string>('NODE_ENV', 'development');
        const isProduction = env === 'production';
        const isTest = env === 'test';

        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USER', 'postgres'),
          password: configService.get<string>('DB_PASS', 'postgres'),
          database: configService.get<string>('DB_NAME', 'circle_events'),
          
          // Auto-load all entities
          autoLoadEntities: true,
          
          // Synchronize schema (disable in production)
          synchronize: configService.get<boolean>(
            'DB_SYNCHRONIZE',
            !isProduction,
          ),
          
          // Enable logging (disable in production)
          logging: configService.get<boolean>('DB_LOGGING', !isProduction),
          
          // Drop schema in test environment
          dropSchema: isTest,
          
          // SSL configuration
          ssl: configService.get<boolean>('DB_SSL', false)
            ? { rejectUnauthorized: false }
            : false,
          
          // Migration settings
          migrationsRun: isProduction,
          migrations: [join(__dirname, '..', 'database/migrations/*{.ts,.js}')],
          migrationsTableName: 'typeorm_migrations',
          
          // Connection pool settings
          extra: {
            max: configService.get<number>('DB_POOL_MAX', 10),
            min: configService.get<number>('DB_POOL_MIN', 2),
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
          
          // Retry configuration
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
