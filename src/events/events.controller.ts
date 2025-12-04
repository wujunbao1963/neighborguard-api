// src/events/events.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

// 如果你把 DevAuthGuard / CurrentUser 放在别的路径，改一下下面两行路径
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('events')
@UseGuards(DevAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * GET /events?circleId=...
   * - 有 circleId：用 findByCircle
   * - 没有 circleId：用 getOpenEventsForUser，返回所有自己能看到的 open 事件
   */
  @Get()
  async listEvents(
    @CurrentUser() user: User,
    @Query('circleId') circleId?: string,
  ) {
    if (circleId) {
      return this.eventsService.findByCircle(circleId, user.id);
    }
    return this.eventsService.getOpenEventsForUser(user.id);
  }

  /**
   * GET /events/:id
   * 用 service.findOne 做权限 + 详情加载
   */
  @Get(':id')
  async getEvent(
    @CurrentUser() user: User,
    @Param('id') eventId: string,
  ) {
    // findOne 已经会检查 circle 成员 / 抛 NotFound
    return this.eventsService.findOne(eventId, user.id);
  }

  /**
   * POST /events
   * 用 service.create(dto, currentUserId)
   */
  @Post()
  async createEvent(
    @CurrentUser() user: User,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(dto, user.id);
  }

  /**
   * PATCH /events/:id/status
   * 注意：service.updateStatus(id, body, currentUserId)
   */
  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id') eventId: string,
    @Body() body: UpdateEventStatusDto,
  ) {
    return this.eventsService.updateStatus(eventId, body, user.id);
  }

  /**
   * ❗ 暂时先不在这里实现 /events/:id/comments / /events/:id/notes
   * 你的 EventsService 里暂时也没有这些方法，
   * 等以后有专门的 notes/comments entity & service 再加对应 controller。
   */
}

