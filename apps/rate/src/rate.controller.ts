import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { RateService } from './rate.service';
import { CoinRate } from '@shared/interfaces';
import { LoggingService } from '@shared/logging.service';

@Controller('rates')
export class RateController {
  constructor(
    private readonly rateService: RateService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(RateController.name);
  }

  @Get('coins')
  getTrackedCoins(): string[] {
    return this.rateService.getTrackedCoins();
  }

  @Get('currencies')
  getTrackedCurrencies(): string[] {
    return this.rateService.getTrackedCurrencies();
  }

  @Post('coins')
  setTrackedCoins(@Body() coins: string[]): { message: string } {
    if (!Array.isArray(coins) || coins.length === 0) {
      throw new BadRequestException('Invalid request: coins array is required');
    }
    this.rateService.setTrackedCoins(coins);
    this.logger.log(`Updated tracked coins: ${coins.join(', ')}`);
    return { message: `Tracked coins updated successfully` };
  }

  @Post('currencies')
  setTrackedCurrencies(@Body() currencies: string[]): { message: string } {
    if (!Array.isArray(currencies) || currencies.length === 0) {
      throw new BadRequestException(
        'Invalid request: currencies array is required',
      );
    }
    this.rateService.setTrackedCurrencies(currencies);
    this.logger.log(`Updated tracked currencies: ${currencies.join(', ')}`);
    return { message: `Tracked currencies updated successfully` };
  }

  @Get('rate')
  async getCoinRate(
    @Query('coin') coin: string,
    @Query('currency') currency = 'usd',
    @Query('skipCache') skipCache = 'false',
  ): Promise<number> {
    if (!coin) {
      throw new Error('Invalid request: coin parameter is required');
    }

    const skipCacheBoolean = skipCache === 'true';
    this.logger.log(
      `Fetching price for ${coin} in ${currency} (skipCache: ${skipCacheBoolean})`,
    );
    return this.rateService.getCoinRate(coin, currency, skipCacheBoolean);
  }

  @Get()
  async getRates(
    @Query('coins') coins: string,
    @Query('currency') currency: string = 'usd',
  ): Promise<{ CoinRates: CoinRate; currency: string }> {
    if (!coins) {
      throw new BadRequestException('Coins query parameter is required');
    }

    const coinList = coins
      .split(',')
      .map((coin) => coin.trim())
      .filter(Boolean);
    if (coinList.length === 0) {
      throw new BadRequestException('Coins array is empty');
    }
    const rates = await this.rateService.getMultipleRates(coinList, currency);
    return { CoinRates: rates, currency };
  }

  @Get('fetch-rates')
  async fetchRates(): Promise<{ message: string }> {
    await this.rateService.fetchRates();
    return { message: 'Rates updated successfully' };
  }
}
