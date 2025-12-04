// src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Query,
  Req,
  Post,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { NotificationsService } from './notifications.service';
import { UsersService } from '../users/users.service';
import { NotificationDto } from './dto/notification.dto';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('notifications')
@UseGuards(DevAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  private async getUserFromReq(req: Request) {
    const headerUserIdRaw = req.headers['x-user-id'];
    const headerUserId = Array.isArray(headerUserIdRaw)
      ? headerUserIdRaw[0]
      : (headerUserIdRaw ?? null);

    return this.usersService.resolveCurrentUser(headerUserId as string | null);
  }

  @Get()
  async listNotifications(
    @Req() req: Request,
    @Query('unreadOnly') unreadOnly: string | undefined,
  ): Promise<NotificationDto[]> {
    const user = await this.getUserFromReq(req);
    const onlyUnread = unreadOnly === 'true';
    return this.notificationsService.listForUser(user.id, onlyUnread);
  }

  // ✅ NEW: return just the number for a badge
  @Get('unread-count')
  async unreadCount(@Req() req: Request): Promise<{ unreadCount: number }> {
    const user = await this.getUserFromReq(req);
    const unreadCount = await this.notificationsService.unreadCountForUser(
      user.id,
    );
    return { unreadCount };
  }

  // ✅ NEW: mark a single notification as read
  @Patch(':id/read')
  async markOneRead(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ ok: boolean }> {
    const user = await this.getUserFromReq(req);
    await this.notificationsService.markRead(user.id, id);
    return { ok: true };
  }

  @Post('mark-all-read')
  async markAllRead(@Req() req: Request): Promise<{ ok: boolean }> {
    const user = await this.getUserFromReq(req);
    await this.notificationsService.markAllRead(user.id);
    return { ok: true };
  }
}
