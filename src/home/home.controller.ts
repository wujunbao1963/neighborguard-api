// src/home/home.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { HomeService } from './home.service';
import { UsersService } from '../users/users.service';
import { HomeTasksDto } from './dto/home-tasks.dto';

import { DevAuthGuard } from '../auth/dev-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('home')
@UseGuards(DevAuthGuard) // 整个 controller 都用 DevAuthGuard
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly usersService: UsersService,
  ) {}

  @Get('tasks')
  async getHomeTasks(@Req() req: Request): Promise<HomeTasksDto> {
    const headerUserIdRaw = req.headers['x-user-id'];
    const headerUserId = Array.isArray(headerUserIdRaw)
      ? headerUserIdRaw[0]
      : (headerUserIdRaw ?? null);

    const user = await this.usersService.resolveCurrentUser(
      headerUserId as string | null,
    );

    return this.homeService.getHomeTasks(user.id);
  }
}
