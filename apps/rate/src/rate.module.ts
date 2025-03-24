import { Module } from '@nestjs/common';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';
import { SharedModule } from '@shared/shared.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FileService } from '@shared/file.service';

@Module({
  imports: [SharedModule, ScheduleModule.forRoot()],
  controllers: [RateController],
  providers: [RateService, FileService],
})
export class RateServiceModule {}
