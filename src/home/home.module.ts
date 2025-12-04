// src/home/home.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HomeController } from './home.controller';
import { HomeService } from './home.service';

import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

import { CircleMember } from '../circles/circle-member.entity';
import { Circle } from '../circles/circle.entity';

import { DevAuthGuard } from '../auth/dev-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Module({
  imports: [
    TypeOrmModule.forFeature([CircleMember, Circle]),
    EventsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [HomeController],
  providers: [HomeService, DevAuthGuard],
})
export class HomeModule {}
