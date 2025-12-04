import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { MeResponseDto } from './dto/me-response.dto';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request): Promise<MeResponseDto> {
    const headerUserIdRaw = req.headers['x-user-id'];
    const headerUserId = Array.isArray(headerUserIdRaw)
      ? headerUserIdRaw[0]
      : (headerUserIdRaw ?? null);

    const user = await this.usersService.resolveCurrentUser(
      headerUserId as string | null,
    );

    return this.usersService.buildMeResponse(user);
  }

  @Get('debug/users')
  async getDebugUsers(): Promise<User[]> {
    if (process.env.NODE_ENV === 'production') throw new NotFoundException();
    return this.usersService.findAllUsers();
  }
}
