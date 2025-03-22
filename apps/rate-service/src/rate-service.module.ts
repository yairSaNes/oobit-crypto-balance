import { Module } from '@nestjs/common';
import { RateServiceController } from './rate-service.controller';
import { RateServiceService } from './rate-service.service';

@Module({
  imports: [],
  controllers: [RateServiceController],
  providers: [RateServiceService],
})
export class RateServiceModule {}
