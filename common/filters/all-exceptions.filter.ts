import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ERROR_CODES } from '../constants';

/**
 * Global exception filter to handle all exceptions consistently
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = response<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = ERROR_CODES.INTERNAL_ERROR;
    let errors: any = undefined;

    // Handle different exception types
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errors = (exceptionResponse as any).errors;
      } else {
        message = exceptionResponse as string;
      }
      
      errorCode = this.mapHttpStatusToErrorCode(status);
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database query failed';
      errorCode = ERROR_CODES.DATABASE_ERROR;
      
      // Don't expose database details in production
      if (process.env.NODE_ENV !== 'production') {
        this.logger.error('Database error:', exception);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Send response
    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      // Only include stack in non-production environments
      ...(process.env.NODE_ENV !== 'production' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    });
  }

  private mapHttpStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.AUTH_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.RESOURCE_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODES.RESOURCE_CONFLICT;
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.INVALID_INPUT;
      default:
        return ERROR_CODES.INTERNAL_ERROR;
    }
  }
}
