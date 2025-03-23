import { Body, Controller, Get, Post } from '@nestjs/common';
import { RateService } from './rate.service';
import { CryptoRate } from '@shared/interfaces';

@Controller()
export class RateController {
  constructor(private readonly rateService: RateService) {}

  @Get()
  async getAllRates(): Promise<CryptoRate[]>{
    return this.rateService.getRates();
  }

  @Post()
  async updateRate(@Body() rate: CryptoRate): Promise<void>{
    await this.rateService.updateRate(rate);
  }
}
