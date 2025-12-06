// src/device-tokens/device-tokens.service.ts
// ADD THIS FILE TO YOUR BACKEND

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from './device-token.entity';

@Injectable()
export class DeviceTokensService {
  constructor(
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepo: Repository<DeviceToken>,
  ) {}

  async registerToken(userId: string, token: string, platform: string): Promise<void> {
    // Check if token already exists
    const existing = await this.deviceTokenRepo.findOne({
      where: { token },
    });

    if (existing) {
      // Update existing token (might be different user now)
      existing.userId = userId;
      existing.platform = platform;
      existing.isActive = true;
      await this.deviceTokenRepo.save(existing);
    } else {
      // Create new token
      const deviceToken = this.deviceTokenRepo.create({
        userId,
        token,
        platform,
        isActive: true,
      });
      await this.deviceTokenRepo.save(deviceToken);
    }
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.deviceTokenRepo.update(
      { userId, token },
      { isActive: false },
    );
  }

  async getTokensForUser(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepo.find({
      where: { userId, isActive: true },
    });
  }

  async getTokensForUsers(userIds: string[]): Promise<DeviceToken[]> {
    if (!userIds.length) return [];
    
    return this.deviceTokenRepo
      .createQueryBuilder('dt')
      .where('dt.userId IN (:...userIds)', { userIds })
      .andWhere('dt.isActive = true')
      .getMany();
  }
}
