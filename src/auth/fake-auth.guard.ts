import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

type RequestWithUser = Request & { currentUser?: User };

@Injectable()
export class FakeAuthGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();

    const raw = req.headers['x-user-id'];
    const userId = Array.isArray(raw) ? raw[0] : raw;

    req.currentUser = await this.usersService.resolveCurrentUser(userId);
    return true;
  }
}
