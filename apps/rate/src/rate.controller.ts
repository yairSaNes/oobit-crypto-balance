import { Body, Controller, Get, HttpStatus, Post, Query } from '@nestjs/common';
import { RateService } from './rate.service';
import { CoinRate } from '@shared/interfaces';
import { LoggingService } from '@shared/logging.service';
import { AppError } from '@shared/AppError';
import { SetTrackedCoinsDto } from './dtos/set-tracked-coins.dto';
import { GetCoinRateDto } from './dtos/get-coin-rate.dto';
import { GetRatesDto } from './dtos/get-all-rates.dto';

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
  async setTrackedCoins(
    @Body() { coins }: SetTrackedCoinsDto,
  ): Promise<{ message: string }> {
    await this.rateService.setTrackedCoins(coins);
    this.logger.log(
      `setTrackedCoins: Updated tracked coins -> ${JSON.stringify(coins)}`,
    );
    return { message: `Tracked coins updated successfully` };
  }

  @Get('rate')
  async getCoinRate(@Query() query: GetCoinRateDto): Promise<number> {
    this.logger.log(
      `Fetching price for ${query.coin} in ${query.currency} (skipCache: ${query.skipCache})`,
    );
    return this.rateService.getCoinRate(
      query.coin,
      query.currency,
      query.skipCache,
    );
  }

  @Get()
  async getRates(
    @Query() query: GetRatesDto,
  ): Promise<{ CoinRates: CoinRate; currency: string }> {
    const coinList = query.coins
      .split(',')
      .map((coin) => coin.trim())
      .filter(Boolean);

    if (coinList.length === 0) {
      throw new AppError('Coins array is empty', HttpStatus.BAD_REQUEST);
    }

    const rates = await this.rateService.getMultipleRates(
      coinList,
      query.currency,
    );
    return { CoinRates: rates, currency: query.currency ?? 'usd' };
  }

  @Get('fetch-rates')
  async fetchRates(): Promise<{ message: string }> {
    await this.rateService.fetchRates();
    return { message: 'Rates updated successfully' };
  }
}
