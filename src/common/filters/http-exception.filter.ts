import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorDetail {
  field?: string;
  message: string;
  constraint?: string;
}

interface ErrorResponse {
  status: 'error' | 'fail';
  message: string;
  errors: ErrorDetail[];
  statusCode: number;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: ErrorDetail[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;

        if (Array.isArray(responseObj.message)) {
          errors = responseObj.message.map((msg: string | Record<string, unknown>) => {
            if (typeof msg === 'string') {
              const match = msg.match(/^(\w+)\s+(.+)$/);
              if (match) {
                return { field: match[1], message: match[2], constraint: match[2] };
              }
              return { message: msg };
            }
            return { field: String(msg), message: String(msg) };
          });
          if (errors.length > 0) {
            message = 'Validation failed';
          }
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errors = [{ message: exception.message }];
    }

    const errorResponse: ErrorResponse = {
      status: status >= 500 ? 'error' : 'fail',
      message,
      errors,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
