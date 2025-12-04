// src/events/events.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Event, EventStatus, EventSeverity } from './event.entity';
import { Circle } from '../circles/circle.entity';
import { VideoAsset } from '../media/video-asset.entity';
import { CircleMember, MemberRole } from '../circles/circle-member.entity';
import { User } from '../users/user.entity';

import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto, EventCreatorRole } from './dto/event-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

import { UpdateEventStatusDto } from './dto/update-event-status.dto';

/**
 * Query DTOs (typically used in controller @Query(), but defined here for convenience)
 * NOTE: unreadOnly is not used for events; it’s meant for notifications queries.
 */
export type EventsListQueryDto = {
  limit?: number; // default 50, max 100
  cursor?: string; // ISO string; returns events with createdAt < cursor
  status?: EventStatus; // OPEN | RESOLVED (or whatever your enum supports)
  unreadOnly?: boolean; // unused here (kept for parity with your ask)
};

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    @InjectRepository(Circle)
    private readonly circlesRepo: Repository<Circle>,
    @InjectRepository(VideoAsset)
    private readonly videoAssetsRepo: Repository<VideoAsset>,
    @InjectRepository(CircleMember)
    private readonly circleMembersRepo: Repository<CircleMember>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ========= 基础权限 / 角色 =========

  private async getMember(
    circleId: string,
    userId: string,
  ): Promise<CircleMember | null> {
    if (!userId) return null;
    return this.circleMembersRepo.findOne({
      where: { circleId, userId } as any,
    });
  }

  /**
   * 确认当前用户是圈内成员，否则抛 Forbidden
   */
  private async assertUserInCircle(
    circleId: string,
    userId: string,
  ): Promise<CircleMember> {
    const member = await this.getMember(circleId, userId);
    if (!member) {
      throw new ForbiddenException('User is not a member of this circle');
    }
    return member;
  }

  /**
   * 当前用户在这个 circle 里的角色（找不到就视为 observer）
   */
  private async getRoleInCircle(
    circleId: string,
    userId: string,
  ): Promise<MemberRole | 'observer'> {
    const member = await this.getMember(circleId, userId);
    if (!member) return 'observer';
    return member.role;
  }

  /**
   * 谁可以 resolve / 改状态？
   * - 事件发起人
   * - 这个 circle 的 Owner
   */
  private canResolveEvent(
    myRole: MemberRole | 'observer',
    currentUserId: string,
    event: Event,
  ): boolean {
    const isOwner = myRole === MemberRole.OWNER;
    const isCreator =
      !!event.createdById && event.createdById === currentUserId;
    return isOwner || isCreator;
  }

  private mapRoleToCreatorRole(
    role: MemberRole | 'observer' | null,
  ): EventCreatorRole {
    if (!role) return 'unknown';
    switch (role) {
      case MemberRole.OWNER:
        return 'owner';
      case MemberRole.RESIDENT:
        return 'resident';
      case MemberRole.NEIGHBOR:
        return 'neighbor';
      default:
        return 'observer';
    }
  }

  // ========= 核心业务 =========

  /**
   * 创建事件
   * currentUserId 由 controller 从 header 解析出来
   * 允许 owner / resident / neighbor 创建（observer 可以自行选择是否允许）
   */
  async create(
    dto: CreateEventDto,
    currentUserId: string,
  ): Promise<EventResponseDto> {
    const circle = await this.circlesRepo.findOne({
      where: { id: dto.circleId },
    });
    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // 必须是圈内成员才能创建
    const myMember = await this.assertUserInCircle(circle.id, currentUserId);

    // 如果你不想让 observer 创建事件，可以禁止（这里用 any 避免依赖 MemberRole.OBSERVER）
    if ((myMember as any).role === 'observer') {
      throw new ForbiddenException('Observer cannot create events');
    }

    // 如果有上传好的视频，尝试加载
    let videoAsset: VideoAsset | null = null;
    if (dto.videoAssetId) {
      videoAsset = await this.videoAssetsRepo.findOne({
        where: { id: dto.videoAssetId },
      });
    }

    const event = this.eventsRepo.create({
      circleId: circle.id,
      title: dto.title ?? null,
      description: dto.description ?? null,
      requestText: dto.requestText,
      eventType: dto.eventType,
      cameraZone: dto.cameraZone,
      severity: dto.severity ?? EventSeverity.MEDIUM,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : null,
      createdById: currentUserId,
      videoAssetId: videoAsset ? videoAsset.id : null,
      // status / resolution / resolutionNote 使用 entity 默认值
    });

    await this.eventsRepo.save(event);

    // 重新加载，带上 circle / video / createdBy 关系
    const loaded = await this.eventsRepo.findOne({
      where: { id: event.id },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });
    if (!loaded) {
      throw new NotFoundException('Event not found after creation');
    }

    // === 新事件通知 ===
    try {
      const circleName = loaded.circle?.name ?? 'your circle';
      const fromName =
        loaded.createdBy?.name ??
        loaded.createdBy?.email ??
        'Someone in your circle';

      const title = `New event in ${circleName}`;
      const message =
        `${fromName}: ` + (loaded.title || loaded.requestText.slice(0, 120));

      await this.notificationsService.createForEventCreated({
        circleId: loaded.circleId,
        eventId: loaded.id,
        excludeUserId: currentUserId,
        title,
        message,
      });
    } catch {
      // 通知失败不影响主流程
    }

    const creatorRoleRaw = loaded.createdById
      ? await this.getRoleInCircle(loaded.circleId, loaded.createdById)
      : 'observer';

    return this.toEventResponseDto(
      loaded,
      currentUserId,
      myMember.role,
      creatorRoleRaw,
    );
  }

  /**
   * 按圈子拉事件列表（支持 pagination + filters）
   *
   * orderBy createdAt DESC
   * take(limit)
   * andWhere createdAt < cursor
   */
  async findByCircle(
    circleId: string,
    currentUserId: string,
    query: EventsListQueryDto = {},
  ): Promise<EventResponseDto[]> {
    // 当前用户必须是 circle 成员
    const myMember = await this.assertUserInCircle(circleId, currentUserId);
    const myRole = myMember.role;

    const limitRaw = query.limit ?? 50;
    const limit = Math.min(Math.max(Number(limitRaw) || 50, 1), 100);

    // Cursor parse (ISO string expected)
    let cursorDate: Date | undefined;
    if (query.cursor != null) {
      cursorDate = new Date(query.cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException(
          'cursor must be an ISO datetime string (e.g. 2025-12-01T00:00:00.000Z)',
        );
      }
    }

    // Status validation (optional)
    if (query.status != null) {
      const allowed = Object.values(EventStatus);
      if (!allowed.includes(query.status)) {
        throw new BadRequestException(
          `status must be one of: ${allowed.join(', ')}`,
        );
      }
    }

    const qb = this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.circle', 'circle')
      .leftJoinAndSelect('event.videoAsset', 'videoAsset')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .where('event.circleId = :circleId', { circleId })
      .orderBy('event.createdAt', 'DESC')
      .take(limit);

    if (query.status != null) {
      qb.andWhere('event.status = :status', { status: query.status });
    }

    if (cursorDate) {
      qb.andWhere('event.createdAt < :cursor', { cursor: cursorDate });
    }

    const events = await qb.getMany();

    const result: EventResponseDto[] = [];
    for (const ev of events) {
      const creatorRoleRaw = ev.createdById
        ? await this.getRoleInCircle(ev.circleId, ev.createdById)
        : 'observer';
      result.push(
        this.toEventResponseDto(ev, currentUserId, myRole, creatorRoleRaw),
      );
    }

    return result;
  }

  /**
   * 单个事件详情
   */
  async findOne(id: string, currentUserId: string): Promise<EventResponseDto> {
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // 当前用户必须是 circle 成员
    const myMember = await this.assertUserInCircle(
      event.circleId,
      currentUserId,
    );
    const myRole = myMember.role;

    const creatorRoleRaw = event.createdById
      ? await this.getRoleInCircle(event.circleId, event.createdById)
      : 'observer';

    return this.toEventResponseDto(
      event,
      currentUserId,
      myRole,
      creatorRoleRaw,
    );
  }

  /**
   * 更新状态 / 结案说明
   * controller 传进来的 body 是 UpdateEventStatusDto
   */
  async updateStatus(
    id: string,
    body: UpdateEventStatusDto,
    currentUserId: string,
  ): Promise<EventResponseDto> {
  
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
 // ⛔ NEW: lock resolved events
  if (event.status === EventStatus.RESOLVED) {
    throw new BadRequestException('Resolved events cannot be modified');
  }
    // 当前用户必须是 circle 成员
    const myRole = await this.getRoleInCircle(event.circleId, currentUserId);
    if (myRole === 'observer') {
      throw new ForbiddenException('You are not a member of this circle');
    }

    // 权限检查：事件发起人 + Owner 可以改状态
    const canResolve = this.canResolveEvent(myRole, currentUserId, event);
    if (!canResolve) {
      throw new ForbiddenException(
        'Only event creator or circle owner can change status',
      );
    }

    const { status, resolution } = body;

    if (status !== undefined) {
      const allowed = Object.values(EventStatus);
      if (!allowed.includes(status)) {
        throw new BadRequestException('Invalid event status');
      }

      // Optional: require a resolution note when resolving
      if (status === EventStatus.RESOLVED && !resolution?.trim()) {
        throw new BadRequestException(
          'resolution is required when resolving an event',
        );
      }

      event.status = status;
    }

    if (typeof resolution === 'string') {
      event.resolutionNote = resolution.trim();
    }

    await this.eventsRepo.save(event);

    // === 结案通知（仅在状态为 resolved 时触发） ===
    if (event.status === EventStatus.RESOLVED) {
      try {
        const circleName = event.circle?.name ?? 'your circle';

        const isCreator =
          !!event.createdById && event.createdById === currentUserId;
        const actorName =
          isCreator && event.createdBy
            ? (event.createdBy.name ??
              event.createdBy.email ??
              'Someone in your circle')
            : 'Someone in your circle';

        const summary =
          event.resolutionNote ||
          event.title ||
          event.requestText?.slice(0, 120) ||
          'An event was resolved';

        const title = `Event resolved in ${circleName}`;
        const message = `${actorName}: ${summary}`;

        await this.notificationsService.createForEventResolved({
          circleId: event.circleId,
          eventId: event.id,
          excludeUserId: currentUserId,
          title,
          message,
        });
      } catch {
        // 通知失败不影响主流程
      }
    }

    const creatorRoleRaw = event.createdById
      ? await this.getRoleInCircle(event.circleId, event.createdById)
      : 'observer';

    return this.toEventResponseDto(
      event,
      currentUserId,
      myRole,
      creatorRoleRaw,
    );
  }

  /**
   * 给后面的 /home/tasks 用：查当前用户所有 circle 的 open 事件
   */
  async getOpenEventsForUser(userId: string): Promise<EventResponseDto[]> {
    const memberships = await this.circleMembersRepo.find({
      where: { userId } as any,
    });
    const circleIds = memberships.map((m) => (m as any).circleId);
    if (circleIds.length === 0) return [];

    const events = await this.eventsRepo.find({
      where: {
        circleId: In(circleIds),
        status: EventStatus.OPEN,
      } as any,
      order: { createdAt: 'DESC' },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });

    const result: EventResponseDto[] = [];
    for (const ev of events) {
      const myRole = await this.getRoleInCircle(ev.circleId, userId);
      const creatorRoleRaw = ev.createdById
        ? await this.getRoleInCircle(ev.circleId, ev.createdById)
        : 'observer';
      result.push(this.toEventResponseDto(ev, userId, myRole, creatorRoleRaw));
    }
    return result;
  }

  // ========= 映射到 DTO =========

  private toEventResponseDto(
    event: Event,
    currentUserId: string,
    myRoleRaw: MemberRole | 'observer',
    creatorRoleRaw?: MemberRole | 'observer',
  ): EventResponseDto {
    const dto = new EventResponseDto();

    dto.id = event.id;
    dto.circleId = event.circleId;
    dto.circleName = event.circle?.name;
    dto.circleAddress = (event.circle as any)?.address;

    dto.title = event.title ?? undefined;
    dto.description = event.description ?? undefined;
    dto.requestText = event.requestText;

    dto.eventType = event.eventType;
    dto.cameraZone = event.cameraZone;
    dto.severity = event.severity;
    dto.status = event.status;

    dto.resolution = event.resolution;
    dto.resolutionNote = event.resolutionNote ?? undefined;

    dto.occurredAt = event.occurredAt ?? undefined;
    dto.createdAt = event.createdAt;
    dto.updatedAt = event.updatedAt;

    dto.videoAssetId = event.videoAssetId ?? undefined;
    dto.videoUrl = event.videoAsset?.url;

    dto.createdById = event.createdById ?? undefined;
    dto.createdByName = event.createdBy?.name;
    dto.createdByEmail = event.createdBy?.email;

    dto.createdByRole = this.mapRoleToCreatorRole(creatorRoleRaw ?? null);

    const isMine = !!event.createdById && event.createdById === currentUserId;
    dto.isMine = isMine;

    dto.myRoleInCircle = this.mapRoleToCreatorRole(myRoleRaw);

    dto.canEditEvent = isMine;

    dto.canChangeResolution = this.canResolveEvent(
      myRoleRaw,
      currentUserId,
      event,
    );

    return dto;
  }

  async getEventsByIds(
    ids: string[],
    currentUserId: string,
  ): Promise<EventResponseDto[]> {
    if (!ids.length) return [];

    const events = await this.eventsRepo.find({
      where: { id: In(ids) } as any,
      relations: ['circle', 'videoAsset', 'createdBy'],
    });

    const result: EventResponseDto[] = [];

    for (const event of events) {
      const myRole = await this.getRoleInCircle(event.circleId, currentUserId);
      if (myRole === 'observer') continue;

      const creatorRole = event.createdById
        ? await this.getRoleInCircle(event.circleId, event.createdById)
        : 'observer';

      result.push(
        this.toEventResponseDto(event, currentUserId, myRole, creatorRole),
      );
    }

    return result;
  }
}
