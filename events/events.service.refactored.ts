import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, LessThan } from 'typeorm';
import { Event } from './entities/event.entity';
import { Circle } from '../circles/entities/circle.entity';
import { VideoAsset } from '../media/entities/video-asset.entity';
import { CircleMember } from '../circles/entities/circle-member.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { EventsListQueryDto } from './dto/events-list-query.dto';
import { EventStatus, EventSeverity } from '../common/constants/event.enums';
import { MemberRole } from '../common/constants/member.enums';
import { PAGINATION } from '../common/constants';

/**
 * Service handling all event-related business logic
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Circle)
    private readonly circlesRepository: Repository<Circle>,
    @InjectRepository(VideoAsset)
    private readonly videoAssetsRepository: Repository<VideoAsset>,
    @InjectRepository(CircleMember)
    private readonly circleMembersRepository: Repository<CircleMember>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ========= Permission & Role Helpers =========

  /**
   * Get circle member for a user
   */
  private async getCircleMember(
    circleId: string,
    userId: string,
  ): Promise<CircleMember | null> {
    if (!userId) {
      return null;
    }

    return this.circleMembersRepository.findOne({
      where: { circleId, userId },
    });
  }

  /**
   * Assert that user is a member of the circle
   * @throws ForbiddenException if user is not a member
   */
  private async assertUserIsMember(
    circleId: string,
    userId: string,
  ): Promise<CircleMember> {
    const member = await this.getCircleMember(circleId, userId);
    
    if (!member) {
      throw new ForbiddenException('User is not a member of this circle');
    }

    return member;
  }

  /**
   * Get user's role in a circle
   */
  private async getUserRoleInCircle(
    circleId: string,
    userId: string,
  ): Promise<MemberRole | null> {
    const member = await this.getCircleMember(circleId, userId);
    return member?.role || null;
  }

  /**
   * Check if user can modify event status
   * Only event creator or circle owner can modify
   */
  private canModifyEventStatus(
    userRole: MemberRole | null,
    userId: string,
    event: Event,
  ): boolean {
    const isOwner = userRole === MemberRole.OWNER;
    const isCreator = event.createdById === userId;
    
    return isOwner || isCreator;
  }

  /**
   * Check if user can create events in circle
   */
  private canCreateEvent(role: MemberRole): boolean {
    // Observers cannot create events
    return role !== MemberRole.OBSERVER;
  }

  // ========= Core Business Logic =========

  /**
   * Create a new event
   */
  async create(
    dto: CreateEventDto,
    currentUserId: string,
  ): Promise<EventResponseDto> {
    this.logger.log(`Creating event for circle ${dto.circleId} by user ${currentUserId}`);

    // Validate circle exists
    const circle = await this.circlesRepository.findOne({
      where: { id: dto.circleId },
    });

    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // Verify user is member and can create events
    const member = await this.assertUserIsMember(circle.id, currentUserId);

    if (!this.canCreateEvent(member.role)) {
      throw new ForbiddenException(
        'You do not have permission to create events in this circle',
      );
    }

    // Validate video asset if provided
    let videoAsset: VideoAsset | null = null;
    if (dto.videoAssetId) {
      videoAsset = await this.videoAssetsRepository.findOne({
        where: { id: dto.videoAssetId },
      });

      if (!videoAsset) {
        throw new NotFoundException('Video asset not found');
      }
    }

    // Create event
    const event = this.eventsRepository.create({
      circleId: circle.id,
      title: dto.title,
      description: dto.description,
      requestText: dto.requestText,
      eventType: dto.eventType,
      cameraZone: dto.cameraZone,
      severity: dto.severity || EventSeverity.MEDIUM,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      createdById: currentUserId,
      videoAssetId: videoAsset?.id,
      status: EventStatus.OPEN,
    });

    await this.eventsRepository.save(event);

    // Reload with relations
    const savedEvent = await this.eventsRepository.findOne({
      where: { id: event.id },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });

    if (!savedEvent) {
      throw new NotFoundException('Event not found after creation');
    }

    // Send notifications
    await this.sendEventCreatedNotification(savedEvent, currentUserId);

    this.logger.log(`Event ${savedEvent.id} created successfully`);

    return this.mapToResponseDto(savedEvent, currentUserId, member.role);
  }

  /**
   * Find events by circle with pagination
   */
  async findByCircle(
    circleId: string,
    currentUserId: string,
    query: EventsListQueryDto,
  ): Promise<EventResponseDto[]> {
    // Verify user is circle member
    const member = await this.assertUserIsMember(circleId, currentUserId);

    // Parse pagination parameters
    const limit = this.validateLimit(query.limit);
    const cursorDate = this.parseCursor(query.cursor);

    // Validate status filter
    if (query.status && !Object.values(EventStatus).includes(query.status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${Object.values(EventStatus).join(', ')}`,
      );
    }

    // Build query
    const queryBuilder = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.circle', 'circle')
      .leftJoinAndSelect('event.videoAsset', 'videoAsset')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .where('event.circleId = :circleId', { circleId })
      .orderBy('event.createdAt', 'DESC')
      .take(limit);

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('event.status = :status', { status: query.status });
    }

    if (cursorDate) {
      queryBuilder.andWhere('event.createdAt < :cursor', {
        cursor: cursorDate,
      });
    }

    const events = await queryBuilder.getMany();

    // Map to DTOs
    return Promise.all(
      events.map(async (event) => {
        const creatorRole = event.createdById
          ? await this.getUserRoleInCircle(event.circleId, event.createdById)
          : null;
        
        return this.mapToResponseDto(event, currentUserId, member.role, creatorRole);
      }),
    );
  }

  /**
   * Find single event by ID
   */
  async findOne(
    eventId: string,
    currentUserId: string,
  ): Promise<EventResponseDto> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Verify user is circle member
    const member = await this.assertUserIsMember(event.circleId, currentUserId);

    const creatorRole = event.createdById
      ? await this.getUserRoleInCircle(event.circleId, event.createdById)
      : null;

    return this.mapToResponseDto(event, currentUserId, member.role, creatorRole);
  }

  /**
   * Update event status
   */
  async updateStatus(
    eventId: string,
    dto: UpdateEventStatusDto,
    currentUserId: string,
  ): Promise<EventResponseDto> {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Prevent modification of resolved events
    if (event.status === EventStatus.RESOLVED) {
      throw new BadRequestException('Resolved events cannot be modified');
    }

    // Verify permissions
    const userRole = await this.getUserRoleInCircle(event.circleId, currentUserId);
    
    if (!userRole) {
      throw new ForbiddenException('You are not a member of this circle');
    }

    if (!this.canModifyEventStatus(userRole, currentUserId, event)) {
      throw new ForbiddenException(
        'Only event creator or circle owner can modify event status',
      );
    }

    // Validate and update status
    if (dto.status) {
      if (!Object.values(EventStatus).includes(dto.status)) {
        throw new BadRequestException('Invalid event status');
      }

      // Require resolution note when resolving
      if (dto.status === EventStatus.RESOLVED && !dto.resolution?.trim()) {
        throw new BadRequestException(
          'Resolution note is required when resolving an event',
        );
      }

      event.status = dto.status;
    }

    // Update resolution note
    if (dto.resolution !== undefined) {
      event.resolutionNote = dto.resolution.trim() || null;
    }

    await this.eventsRepository.save(event);

    // Send notification if event was resolved
    if (event.status === EventStatus.RESOLVED) {
      await this.sendEventResolvedNotification(event, currentUserId);
    }

    const creatorRole = event.createdById
      ? await this.getUserRoleInCircle(event.circleId, event.createdById)
      : null;

    this.logger.log(`Event ${eventId} status updated to ${event.status}`);

    return this.mapToResponseDto(event, currentUserId, userRole, creatorRole);
  }

  /**
   * Get open events for user across all their circles
   */
  async getOpenEventsForUser(userId: string): Promise<EventResponseDto[]> {
    // Get all user's circle memberships
    const memberships = await this.circleMembersRepository.find({
      where: { userId },
    });

    const circleIds = memberships.map((m) => m.circleId);

    if (circleIds.length === 0) {
      return [];
    }

    // Find all open events in these circles
    const events = await this.eventsRepository.find({
      where: {
        circleId: In(circleIds),
        status: EventStatus.OPEN,
      },
      order: { createdAt: 'DESC' },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });

    // Map to DTOs
    return Promise.all(
      events.map(async (event) => {
        const userRole = await this.getUserRoleInCircle(event.circleId, userId);
        const creatorRole = event.createdById
          ? await this.getUserRoleInCircle(event.circleId, event.createdById)
          : null;

        return this.mapToResponseDto(event, userId, userRole, creatorRole);
      }),
    );
  }

  /**
   * Get events by IDs
   */
  async getEventsByIds(
    eventIds: string[],
    currentUserId: string,
  ): Promise<EventResponseDto[]> {
    if (eventIds.length === 0) {
      return [];
    }

    const events = await this.eventsRepository.find({
      where: { id: In(eventIds) },
      relations: ['circle', 'videoAsset', 'createdBy'],
    });

    const results: EventResponseDto[] = [];

    for (const event of events) {
      const userRole = await this.getUserRoleInCircle(
        event.circleId,
        currentUserId,
      );

      // Skip if user is not a member
      if (!userRole) {
        continue;
      }

      const creatorRole = event.createdById
        ? await this.getUserRoleInCircle(event.circleId, event.createdById)
        : null;

      results.push(
        this.mapToResponseDto(event, currentUserId, userRole, creatorRole),
      );
    }

    return results;
  }

  // ========= Helper Methods =========

  /**
   * Validate and normalize limit parameter
   */
  private validateLimit(limit?: number): number {
    const parsedLimit = Number(limit) || PAGINATION.DEFAULT_LIMIT;
    return Math.min(
      Math.max(parsedLimit, PAGINATION.MIN_LIMIT),
      PAGINATION.MAX_LIMIT,
    );
  }

  /**
   * Parse and validate cursor
   */
  private parseCursor(cursor?: string): Date | undefined {
    if (!cursor) {
      return undefined;
    }

    const date = new Date(cursor);

    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        'Invalid cursor format. Expected ISO datetime string',
      );
    }

    return date;
  }

  /**
   * Send notification when event is created
   */
  private async sendEventCreatedNotification(
    event: Event,
    currentUserId: string,
  ): Promise<void> {
    try {
      const circleName = event.circle?.name || 'your circle';
      const creatorName =
        event.createdBy?.name ||
        event.createdBy?.email ||
        'Someone in your circle';

      const title = `New event in ${circleName}`;
      const message = `${creatorName}: ${event.title || event.requestText.substring(0, 120)}`;

      await this.notificationsService.createForEventCreated({
        circleId: event.circleId,
        eventId: event.id,
        excludeUserId: currentUserId,
        title,
        message,
      });
    } catch (error) {
      this.logger.error('Failed to send event created notification', error);
      // Don't fail the main operation if notification fails
    }
  }

  /**
   * Send notification when event is resolved
   */
  private async sendEventResolvedNotification(
    event: Event,
    currentUserId: string,
  ): Promise<void> {
    try {
      const circleName = event.circle?.name || 'your circle';
      const isCreator = event.createdById === currentUserId;
      const actorName = isCreator && event.createdBy
        ? event.createdBy.name || event.createdBy.email || 'Someone'
        : 'Someone in your circle';

      const summary =
        event.resolutionNote ||
        event.title ||
        event.requestText?.substring(0, 120) ||
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
    } catch (error) {
      this.logger.error('Failed to send event resolved notification', error);
      // Don't fail the main operation if notification fails
    }
  }

  /**
   * Map event entity to response DTO
   */
  private mapToResponseDto(
    event: Event,
    currentUserId: string,
    userRole: MemberRole | null,
    creatorRole?: MemberRole | null,
  ): EventResponseDto {
    const isCreator = event.createdById === currentUserId;

    return {
      id: event.id,
      circleId: event.circleId,
      circleName: event.circle?.name,
      circleAddress: event.circle?.address,
      
      title: event.title,
      description: event.description,
      requestText: event.requestText,
      
      eventType: event.eventType,
      cameraZone: event.cameraZone,
      severity: event.severity,
      status: event.status,
      
      resolution: event.resolution,
      resolutionNote: event.resolutionNote,
      
      occurredAt: event.occurredAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      
      videoAssetId: event.videoAssetId,
      videoUrl: event.videoAsset?.url,
      
      createdById: event.createdById,
      createdByName: event.createdBy?.name,
      createdByEmail: event.createdBy?.email,
      createdByRole: creatorRole,
      
      isMine: isCreator,
      myRoleInCircle: userRole,
      
      canEditEvent: isCreator,
      canChangeResolution: this.canModifyEventStatus(
        userRole,
        currentUserId,
        event,
      ),
    };
  }
}
