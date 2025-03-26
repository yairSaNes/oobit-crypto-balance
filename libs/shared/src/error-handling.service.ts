import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LoggingService } from './logging.service';

@Injectable()
export class ErrorHandlingService {
  constructor(private readonly logger: LoggingService) {}

  handleError(error: any): never {
    if (error instanceof HttpException) {
      this.logger.error(`HTTP Error: ${JSON.stringify(error.getResponse())}`);
      throw error; // Already an HttpException, rethrow it.
    }

    // Fallback for unknown errors
    this.logger.error(
      'Unexpected error:',
      error instanceof Error ? error.message : String(error),
    );
    throw new HttpException(
      {
        message: 'Internal Server Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
