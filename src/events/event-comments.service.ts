import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Event } from './event.entity';
import { EventComment, EventCommentType } from './event-comment.entity';
import { User } from '../users/user.entity';
import { CircleMember } from '../circles/circle-member.entity';

import { CreateEventCommentDto } from './dto/create-event-comment.dto';
import { EventCommentResponseDto } from './dto/event-comment-response.dto';

@Injectable()
export class EventCommentsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    @InjectRepository(EventComment)
    private readonly commentsRepo: Repository<EventComment>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(CircleMember)
    private readonly circleMembersRepo: Repository<CircleMember>,
  ) {}

  // ✅ 简单权限：必须是这个圈子的成员
  private async assertUserInCircle(circleId: string, userId: string) {
    const member = await this.circleMembersRepo.findOne({
      where: { circleId, userId } as any,
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this circle');
    }
  }

  // GET /events/:eventId/comments
  async listForEvent(
    eventId: string,
    currentUserId: string,
  ): Promise<EventCommentResponseDto[]> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.assertUserInCircle(event.circleId, currentUserId);

    const comments = await this.commentsRepo.find({
      where: { eventId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return comments.map((c) => this.toResponseDto(c));
  }

  // POST /events/:eventId/comments
  async create(
    eventId: string,
    dto: CreateEventCommentDto,
    currentUserId: string,
  ): Promise<EventCommentResponseDto> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.assertUserInCircle(event.circleId, currentUserId);

    const user = await this.usersRepo.findOne({ where: { id: currentUserId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comment = this.commentsRepo.create({
      eventId: event.id,
      circleId: event.circleId,
      userId: currentUserId,
      body: dto.body, // ✅ 用 body
      type: dto.type ?? EventCommentType.COMMENT,
    });

    await this.commentsRepo.save(comment);

    const saved = await this.commentsRepo.findOne({
      where: { id: comment.id },
      relations: ['user'],
    });

    return this.toResponseDto(saved!);
  }

  private toResponseDto(comment: EventComment): EventCommentResponseDto {
    const dto = new EventCommentResponseDto();
    dto.id = comment.id;
    dto.eventId = comment.eventId;
    dto.circleId = comment.circleId;
    dto.userId = comment.userId;
    dto.userName = (comment.user as any)?.name ?? '';
    dto.userEmail = (comment.user as any)?.email ?? '';
    dto.body = comment.body; // ✅ body
    dto.type = comment.type;
    dto.createdAt = comment.createdAt;
    return dto;
  }
}
