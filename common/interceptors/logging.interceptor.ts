import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor to log HTTP requests and responses
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${url} - ${ip} - ${userAgent}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const { statusCode } = response;
          const contentLength = response.get('content-length') || 0;
          const elapsed = Date.now() - now;

          this.logger.log(
            `Outgoing Response: ${method} ${url} - ${statusCode} - ${contentLength}bytes - ${elapsed}ms`,
          );
        },
        error: (error) => {
          const elapsed = Date.now() - now;
          this.logger.error(
            `Error Response: ${method} ${url} - ${error.status || 500} - ${elapsed}ms`,
          );
        },
      }),
    );
  }
}
