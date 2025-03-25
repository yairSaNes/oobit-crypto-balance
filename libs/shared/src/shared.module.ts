import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { LoggingService } from './logging.service';

@Module({
  providers: [FileService, LoggingService],
  exports: [FileService, LoggingService],
})
export class SharedModule {}
