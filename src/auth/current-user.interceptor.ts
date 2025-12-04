import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { from, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

type RequestWithUser = Request & { currentUser?: User };

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();

    const raw = req.headers['x-user-id'];
    const userId = Array.isArray(raw) ? raw[0] : raw;

    return from(this.usersService.resolveCurrentUser(userId)).pipe(
      mergeMap((user) => {
        req.currentUser = user;
        return next.handle();
      }),
    );
  }
}
