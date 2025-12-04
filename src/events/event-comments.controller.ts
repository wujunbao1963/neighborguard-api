import { Controller, Get, Post, Param, Body } from '@nestjs/common';

import { EventCommentsService } from './event-comments.service';
import { CreateEventCommentDto } from './dto/create-event-comment.dto';
import { EventCommentResponseDto } from './dto/event-comment-response.dto';

import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('events/:eventId/comments')
export class EventCommentsController {
  constructor(private readonly commentsService: EventCommentsService) {}

  @Get()
  async listComments(
    @CurrentUser() user: User,
    @Param('eventId') eventId: string,
  ): Promise<EventCommentResponseDto[]> {
    return this.commentsService.listForEvent(eventId, user.id);
  }

  @Post()
  async createComment(
    @CurrentUser() user: User,
    @Param('eventId') eventId: string,
    @Body() dto: CreateEventCommentDto,
  ): Promise<EventCommentResponseDto> {
    return this.commentsService.create(eventId, dto, user.id);
  }
}
