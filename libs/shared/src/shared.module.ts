import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { LoggingService } from './logging.service';
import { ErrorHandlingService } from './error-handling.service';

@Module({
  providers: [FileService, LoggingService, ErrorHandlingService],
  exports: [FileService, LoggingService, ErrorHandlingService],
})
export class SharedModule {}
