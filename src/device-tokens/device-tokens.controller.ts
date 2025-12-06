// src/device-tokens/device-tokens.controller.ts

import { Controller, Post, Body, Delete, Headers } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { DeviceTokensService } from './device-tokens.service';

class RegisterTokenDto {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  platform: string; // 'ios' or 'android'
}

class UnregisterTokenDto {
  @IsString()
  token: string;
}

@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  async register(
    @Headers('x-user-id') userId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    await this.deviceTokensService.registerToken(userId, dto.token, dto.platform || 'ios');
    return { success: true };
  }

  @Delete()
  async unregister(
    @Headers('x-user-id') userId: string,
    @Body() dto: UnregisterTokenDto,
  ) {
    await this.deviceTokensService.unregisterToken(userId, dto.token);
    return { success: true };
  }
}
