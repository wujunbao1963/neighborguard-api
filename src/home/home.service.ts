// src/home/home.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { HomeTasksDto, CircleSummaryDto } from './dto/home-tasks.dto';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';

import { CircleMember } from '../circles/circle-member.entity';
import { Circle } from '../circles/circle.entity';
import { EventStatus } from '../events/event.entity';
import { EventResponseDto } from '../events/dto/event-response.dto';

@Injectable()
export class HomeService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(CircleMember)
    private readonly circleMembersRepo: Repository<CircleMember>,
    @InjectRepository(Circle)
    private readonly circlesRepo: Repository<Circle>,
  ) {}

  async getHomeTasks(currentUserId: string): Promise<HomeTasksDto> {
    // 1. 我加入了哪些圈子
    const memberships = await this.circleMembersRepo.find({
      where: { userId: currentUserId } as any,
    });
    const circleIds = memberships.map((m) => (m as any).circleId);

    const circles = circleIds.length
      ? await this.circlesRepo.find({
          where: { id: In(circleIds) } as any,
        })
      : [];

    const myCircles: CircleSummaryDto[] = circles.map((c) => {
      const membership = memberships.find(
        (m) => (m as any).circleId === (c as any).id,
      );
      return {
        id: (c as any).id,
        name: (c as any).name ?? 'Unnamed place',
        address: (c as any).address ?? undefined,
        role: (membership as any)?.role ?? 'member',
      };
    });

    // 2. 这些圈子里的所有 open 事件（用于 pendingEvents 和 fallback）
    const openEvents =
      await this.eventsService.getOpenEventsForUser(currentUserId);

    // pendingEvents: 我有权限处理、且仍是 open 的
 const pendingEvents = openEvents.filter(
  (ev) => ev.status === EventStatus.OPEN,
);

    // 3. 通知：只拿未读
    const inboxNotifications = await this.notificationsService.listForUser(
      currentUserId,
      true,
    );

    // 4. 尝试用未读的 event_created 通知来计算 Inbox New Events
    const eventCreatedNotifs = inboxNotifications.filter(
      (n: any) => n.type === 'event_created' && n.payload?.eventId,
    );

    const seen = new Set<string>();
    const eventIds: string[] = [];
    for (const n of eventCreatedNotifs) {
      const id = n.payload.eventId as string;
      if (!seen.has(id)) {
        seen.add(id);
        eventIds.push(id);
      }
    }

    let inboxNewEvents: EventResponseDto[] = [];

    if (eventIds.length > 0) {
      // ✅ 通知已正常生成时：根据通知里的 eventId 精确拿事件
      inboxNewEvents = await this.eventsService.getEventsByIds(
        eventIds,
        currentUserId,
      );
    } else {
      // ⚠️ 没有任何 event_created 通知（例如只有一个用户、通知还没完全接好）
      //    => fallback：用“最近 24 小时的 open 事件”来顶上，
      //       这样你至少能在 Inbox 看到新事件。
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      inboxNewEvents = openEvents.filter((ev) => {
        const t = new Date(ev.createdAt).getTime();
        const isNew = now - t < ONE_DAY_MS;
        return isNew;
      });
    }

    const dto = new HomeTasksDto();
    dto.inboxNewEvents = inboxNewEvents;
    dto.inboxNotifications = inboxNotifications;
    dto.pendingEvents = pendingEvents;
    dto.myCircles = myCircles;
    return dto;
  }
}
