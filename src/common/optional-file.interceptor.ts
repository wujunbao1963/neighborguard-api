import {
  CallHandler,
  ExecutionContext,
  mixin,
  NestInterceptor,
  Type,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * FileInterceptor that only runs for multipart/form-data requests.
 * This lets a single route accept BOTH:
 *  - application/json (no file)
 *  - multipart/form-data (optional file + fields)
 */
export function OptionalFileInterceptor(
  fieldName: string,
  options?: MulterOptions,
): Type<NestInterceptor> {
  const InterceptorClass = FileInterceptor(fieldName, options);

  class MixinInterceptor implements NestInterceptor {
    private readonly interceptor = new (InterceptorClass as any)();

    intercept(context: ExecutionContext, next: CallHandler) {
      const req = context.switchToHttp().getRequest();
      const contentType: unknown = req?.headers?.['content-type'];

      if (
        typeof contentType === 'string' &&
        contentType.toLowerCase().startsWith('multipart/form-data')
      ) {
        return this.interceptor.intercept(context, next);
      }

      return next.handle();
    }
  }

  return mixin(MixinInterceptor);
}
