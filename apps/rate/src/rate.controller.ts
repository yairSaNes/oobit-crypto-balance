import { BadRequestException, Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { RateService } from './rate.service';
import { CryptoRate } from '@shared/interfaces';

@Controller('rates')
export class RateController {
  private readonly logger = new Logger(RateController.name);

  constructor(private readonly rateService: RateService) {}

  @Get('coins')
  getSupportedCoins(): string[] {
    return this.rateService.getSupportedCoins();
  }

  @Get('currencies')
  getSupportedCurrencies(): string[] {
    return this.rateService.getSupportedCurrencies();
  }

  @Post('coins')
  setSupportedCoins(@Body() coins: string[]): { message: string } {
    if (!Array.isArray(coins) || coins.length === 0) {
      throw new BadRequestException('Invalid request: coins array is required');
    }
    this.rateService.setSupportedCoins(coins);
    this.logger.log(`Updated supported coins: ${coins.join(', ')}`);
    return { message: `Supported coins updated successfully` };
  }

  @Post('currencies')
  setSupportedCurrencies(@Body() currencies: string[]): { message: string } {
    if (!Array.isArray(currencies) || currencies.length === 0) {
      throw new BadRequestException('Invalid request: currencies array is required');
    }
    this.rateService.setSupportedCurrencies(currencies);
    this.logger.log(`Updated supported currencies: ${currencies.join(', ')}`);
    return { message: `Supported currencies updated successfully` };
  }

  @Get('price')
  async getCryptoPrice(
    @Query('coin') coin: string,
    @Query('currency') currency = 'usd',
    @Query('skipCache') skipCache = 'false',
  ): Promise<number> {
    if (!coin) {
      throw new Error('Invalid request: coin parameter is required');
    }

    const skipCacheBoolean = skipCache === 'true';
    this.logger.log(`Fetching price for ${coin} in ${currency} (skipCache: ${skipCacheBoolean})`);
    return this.rateService.getCryptoPrice(coin, currency, skipCacheBoolean);
  }

  @Get('fetch-rates')
  async fetchRates(): Promise<{ message: string }> {
    await this.rateService.fetchRates();
    return { message: 'Rates updated successfully' };
  }
}
