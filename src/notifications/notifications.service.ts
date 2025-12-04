// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type as TransformType } from 'class-transformer';

import { Notification, NotificationType } from './notification.entity';
import { CircleMember } from '../circles/circle-member.entity';
import { NotificationDto } from './dto/notification.dto';

/**
 * Query DTO for listing notifications.
 * NOTE: Typically this would live in src/notifications/dto, but placed here per request.
 */
export class ListNotificationsQueryDto {
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  // ISO cursor timestamp; return items with createdAt < cursor
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  unreadOnly?: boolean;

  /**
   * "status" is included because you asked for it.
   * For notifications, it maps naturally to NotificationType filtering.
   * You can also use `type` (same behavior).
   */
  @IsOptional()
  @IsEnum(NotificationType)
  status?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(CircleMember)
    private readonly circleMembersRepo: Repository<CircleMember>,
  ) {}

  /**
   * 通用方法：给某个 circle 的所有成员发通知
   * - 可选 excludeUserId 用于跳过自己（比如自己创建 / 结案时）
   * - payload 里统一塞 circleId / eventId / title / message
   */
  async createForCircleMembers(params: {
    circleId: string;
    excludeUserId?: string;
    type: NotificationType;
    title: string;
    message: string;
    eventId: string;
  }): Promise<void> {
    const members = await this.circleMembersRepo.find({
      where: { circleId: params.circleId } as any,
    });

    const toCreate: Notification[] = [];
    for (const m of members) {
      const userId = (m as any).userId as string;
      if (params.excludeUserId && userId === params.excludeUserId) continue;

      const n = this.notificationsRepo.create({
        userId,
        type: params.type,
        payload: {
          circleId: params.circleId,
          eventId: params.eventId,
          title: params.title,
          message: params.message,
        },
        isRead: false,
      });
      toCreate.push(n);
    }

    if (toCreate.length) {
      await this.notificationsRepo.save(toCreate);
    }
  }

  /**
   * 语义化封装：新建事件时的通知
   * EventsService.createEvent() 中调用
   */
  async createForEventCreated(params: {
    circleId: string;
    eventId: string;
    excludeUserId?: string;
    title: string;
    message: string;
  }): Promise<void> {
    const { circleId, eventId, excludeUserId, title, message } = params;
    return this.createForCircleMembers({
      circleId,
      eventId,
      excludeUserId,
      type: NotificationType.EVENT_CREATED,
      title,
      message,
    });
  }

  /**
   * 语义化封装：事件结案时的通知
   * EventsService.updateStatus() / updateEventStatus() 中调用
   */
  async createForEventResolved(params: {
    circleId: string;
    eventId: string;
    excludeUserId?: string;
    title: string;
    message: string;
  }): Promise<void> {
    const { circleId, eventId, excludeUserId, title, message } = params;
    return this.createForCircleMembers({
      circleId,
      eventId,
      excludeUserId,
      type: NotificationType.EVENT_RESOLVED,
      title,
      message,
    });
  }

  /**
   * Backwards compatible:
   * - old: listForUser(userId, unreadOnly, type?)
   * - new: listForUser(userId, queryDto)
   */
  async listForUser(
    userId: string,
    unreadOnlyOrQuery: boolean | ListNotificationsQueryDto,
    type?: NotificationType,
  ): Promise<NotificationDto[]> {
    const query: ListNotificationsQueryDto =
      typeof unreadOnlyOrQuery === 'boolean'
        ? {
            unreadOnly: unreadOnlyOrQuery,
            type,
          }
        : unreadOnlyOrQuery;

    const limit = query.limit ?? 20;
    const filterType = query.type ?? query.status;

    const qb = this.notificationsRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId });

    if (query.unreadOnly) {
      qb.andWhere('n.isRead = false');
    }

    if (filterType) {
      qb.andWhere('n.type = :type', { type: filterType });
    }

    if (query.cursor) {
      // cursor is ISO string; fetch items strictly older than cursor
      qb.andWhere('n.createdAt < :cursor', { cursor: query.cursor });
    }

    const notifications = await qb
      .orderBy('n.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return notifications.map((n) => {
      const dto = new NotificationDto();
      dto.id = n.id;
      dto.type = n.type;
      dto.payload = n.payload;
      dto.isRead = n.isRead;
      dto.createdAt = n.createdAt;
      return dto;
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationsRepo.update({ userId, isRead: false } as any, {
      isRead: true,
    });
  }

  async unreadCountForUser(userId: string): Promise<number> {
    return this.notificationsRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    const result = await this.notificationsRepo.update(
      { id: notificationId, userId },
      { isRead: true },
    );

    // If nothing updated: either doesn't exist or doesn't belong to the user
    if (!result.affected) {
      // choose what you prefer (NotFoundException is common)
      throw new NotFoundException('Notification not found');
    }
  }
}
