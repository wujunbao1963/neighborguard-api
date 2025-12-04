import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './event.entity';
import { Circle } from '../circles/circle.entity';
import { VideoAsset } from '../media/video-asset.entity';
import { CircleMember } from '../circles/circle-member.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MediaModule } from '../media/media.module';
import { EventComment } from './event-comment.entity';
import { EventCommentsService } from './event-comments.service';
import { EventCommentsController } from './event-comments.controller';
import { EventNotesController } from './event-notes.controller';
import { EventNotesService } from './event-notes.service';
import { DevAuthGuard } from '../auth/dev-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      Circle,
      VideoAsset,
      CircleMember,
      EventComment,
      User,
    ]),
    UsersModule,
    NotificationsModule, // ✅ 让 EventsService 能注入 NotificationsService
    MediaModule,
  ],
  controllers: [
    EventsController,
    EventCommentsController,
    EventNotesController,
  ],
  providers: [EventsService, EventCommentsService, EventNotesService,DevAuthGuard],
  exports: [EventsService, EventCommentsService, EventNotesService],
})
export class EventsModule {}
