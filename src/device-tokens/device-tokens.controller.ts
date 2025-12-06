// src/device-tokens/device-tokens.controller.ts
// ADD THIS FILE TO YOUR BACKEND

import { Controller, Post, Body, Delete, Headers } from '@nestjs/common';
import { DeviceTokensService } from './device-tokens.service';

class RegisterTokenDto {
  token: string;
  platform: string; // 'ios' or 'android'
}

@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  async register(
    @Headers('x-user-id') userId: string,
    @Body() dto: RegisterTokenDto,
  ) {
    await this.deviceTokensService.registerToken(userId, dto.token, dto.platform);
    return { success: true };
  }

  @Delete()
  async unregister(
    @Headers('x-user-id') userId: string,
    @Body() dto: { token: string },
  ) {
    await this.deviceTokensService.unregisterToken(userId, dto.token);
    return { success: true };
  }
}
