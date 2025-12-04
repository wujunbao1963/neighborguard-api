// src/auth/dev-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

// 开发默认用户：吴军保
const FALLBACK_USER_ID = 'f2bf0b90-14a3-4ae9-8bd9-1c6599c0c001';

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    // 前端 api.ts 里发送的 header
    const headerUserId = req.headers['x-user-id'] as string | undefined;
    const userId = headerUserId || FALLBACK_USER_ID;

    // 在请求对象上挂一个“当前用户”
    // 注意：这里只保证 id，有需要再扩展
    (req as any).user = { id: userId };

    return true;
  }
}

