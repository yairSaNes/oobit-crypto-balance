import { Module } from '@nestjs/common';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';
import { SharedModule } from '@shared/shared.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [SharedModule,ScheduleModule.forRoot()],
  controllers: [RateController],
  providers: [RateService],
})
export class RateServiceModule {}
