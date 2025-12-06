// src/device-tokens/device-tokens.module.ts
// ADD THIS FILE TO YOUR BACKEND

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceToken } from './device-token.entity';
import { DeviceTokensController } from './device-tokens.controller';
import { DeviceTokensService } from './device-tokens.service';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken])],
  controllers: [DeviceTokensController],
  providers: [DeviceTokensService],
  exports: [DeviceTokensService],
})
export class DeviceTokensModule {}
