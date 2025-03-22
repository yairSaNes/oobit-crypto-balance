import { Controller, Get } from '@nestjs/common';
import { RateServiceService } from './rate-service.service';

@Controller()
export class RateServiceController {
  constructor(private readonly rateServiceService: RateServiceService) {}

  @Get()
  getHello(): string {
    return this.rateServiceService.getHello();
  }
}
