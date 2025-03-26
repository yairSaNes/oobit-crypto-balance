import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { LoggingService } from './logging.service';
import { ErrorHandlingService } from './error-handling.service';
import { AuthService } from './auth.service';

@Module({
  providers: [FileService, LoggingService, ErrorHandlingService, AuthService],
  exports: [FileService, LoggingService, ErrorHandlingService, AuthService],
})
export class SharedModule {}
