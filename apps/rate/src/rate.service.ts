import { HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggingService } from '@shared/logging.service';
import { AppError } from '@shared/AppError';
import { FileService } from '@shared/file.service';
import axios, { AxiosError } from 'axios';
import { CoinRate, TrackedData } from '@shared/interfaces';
import { ErrorHandlingService } from '@shared/error-handling.service';
import * as path from 'path';

type ExchangeRates = Record<string, CoinRate>;

@Injectable()
export class RateService {
  private readonly filePath = path.join(__dirname, '../../data/rates.json');

  private readonly COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple';
  private readonly ENDPOINT_PRICE = '/price';
  private readonly GET_RATES_URL = this.COINGECKO_URL + this.ENDPOINT_PRICE;
  private readonly DEFAULT_CURRENCY = 'usd';

  private trackedCoins: string[] = [];
  private trackedCurrencies: string[] = [];
  private cachedCoinRates: Record<string, CoinRate> = {};
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS: number = 60 * 1000;

  constructor(
    private readonly fileService: FileService,
    private readonly logger: LoggingService,
    private readonly errorHandler: ErrorHandlingService,
  ) {
    this.logger.setContext(RateService.name);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Restoring supported coins and currencies from file...');
    await this.restoreTrackedData(); //restore data from file after crash
    await this.fetchRates(); //get rates from coin gecho api
  }

  getTrackedCoins(): string[] {
    return this.trackedCoins;
  }

  getTrackedCurrencies(): string[] {
    return this.trackedCurrencies;
  }

  //changes trackedCoins  array
  async setTrackedCoins(trackedCoins: string[]): Promise<void> {
    try {
      //fetch rates for new coins to validate coins are supported
      await this.getMultipleRates(trackedCoins);
      this.trackedCoins = [...new Set(trackedCoins)];
      this.logger.log(
        `updated tracked coins with ${trackedCoins.length} coins`,
      );
    } catch (error) {
      this.errorHandler.handleError(error);
    }
  }

  //changes trackedCurrencies array
  setTrackedCurrencies(trackedCurrencies: string[]): void {
    this.trackedCurrencies = [...new Set(trackedCurrencies)];
    this.logger.log(
      `updated tracked currencies with ${trackedCurrencies.length} currencies`,
    );
  }

  //adds a coin to trackedCoins
  addTrackedCoin(coin: string): void {
    if (!this.trackedCoins.includes(coin)) {
      this.trackedCoins.push(coin);
    }
  }

  //adds a currency to trackedCurrencies
  addTrackedCurrency(currency: string): void {
    if (!this.trackedCurrencies.includes(currency)) {
      this.trackedCurrencies.push(currency);
    }
  }

  //gets rates for all supported coins and currencies and updates the cache
  async fetchRates(): Promise<void> {
    if (this.trackedCoins.length === 0 || this.trackedCurrencies.length === 0) {
      this.logger.warn('No supported coins or currencies to fetch rates for.');
      return;
    }
    try {
      const coins = this.trackedCoins.join(',');
      const currencies = this.trackedCurrencies.join(',');
      const response = await axios.get<ExchangeRates>(this.GET_RATES_URL, {
        params: {
          ids: coins,
          vs_currencies: currencies,
        },
      });
      this.cacheRates(response.data as Record<string, CoinRate>); //updates cache
      this.logger.log(
        `Fetched rates for ${Object.keys(response.data as object).length} coins.`,
      );
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === HttpStatus.TOO_MANY_REQUESTS
      ) {
        this.logger.warn(
          `Rate limit hit for CoinGecko, retrying in 10 seconds...`,
        );
        await new Promise((res) => setTimeout(res, 10_000));
        return await this.fetchRates();
      }
      this.logger.error(
        'Error fetching rates from CoinGecko',
        error instanceof Error ? error.message : String(error),
      );
      this.errorHandler.handleError(error);
    }
  }

  private cacheRates(rates: Record<string, CoinRate>): void {
    //update cache
    Object.keys(rates).forEach((coin) => {
      this.cachedCoinRates[coin] = {
        ...this.cachedCoinRates[coin],
        ...rates[coin],
      };
    });
    //update cache expiration
    this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;
  }

  private getRateFromCache(coin: string, currency: string): number {
    if (Date.now() > this.cacheExpiry) {
      this.logger.warn('Cache expired...');
      return 0;
    }
    return this.cachedCoinRates[coin]?.[currency] ?? 0;
  }

  //cron job to fetch rates
  @Cron(CronExpression.EVERY_MINUTE)
  async fetchPeriodically() {
    this.logger.log('Fetching latest crypto rates...');
    await this.fetchRates();
  }

  //stores trackedCoins & supportedcurrencies to file for crash failsafe
  @Cron(CronExpression.EVERY_5_MINUTES)
  async saveTrackedDataToFile(): Promise<void> {
    const data = {
      timeStamp: Date.now(),
      trackedCoins: this.trackedCoins,
      trackedCurrencies: this.trackedCurrencies,
    };
    await this.fileService.writeJsonFile(this.filePath, data);
    this.logger.log(
      `Saved ${this.trackedCoins.length} supported coins and ${this.trackedCurrencies.length} supported currencies to disk`,
    );
  }

  // restore supported data from file
  async restoreTrackedData(): Promise<void> {
    try {
      const data = await this.fileService.readJsonFile<TrackedData>(
        this.filePath,
      );
      if (!data?.trackedCoins || !data?.trackedCurrencies) {
        this.logger.warn(
          'No valid supported coins or currencies found in stored data.',
        );
        return;
      }
      this.trackedCoins = data.trackedCoins;
      this.trackedCurrencies = data.trackedCurrencies;
      const restoredAt = new Date(data.timeStamp).toISOString();
      this.logger.log(
        `Supported coins and currencies restored from file (Last saved: ${restoredAt})`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to restore supported coins and currencies from file: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  //get rate for 1 crypto coin with 1 currency
  async getCoinRate(
    coin: string,
    currency: string = this.DEFAULT_CURRENCY,
  ): Promise<number> {
    //if cache isn't expired
    if (Date.now() < this.cacheExpiry) {
      //search cache for rate:
      const cachedRate = this.cachedCoinRates[coin]?.[currency];
      if (cachedRate) {
        this.logger.log(
          `Rate for ${coin} in ${currency} found in cache: ${cachedRate}`,
        );
        return cachedRate;
      }
    }
    //adds requested coin and currency to supportedData
    try {
      const response = await axios.get<ExchangeRates>(this.GET_RATES_URL, {
        params: {
          ids: coin,
          vs_currencies: currency,
        },
      });
      const coinData = response.data[coin];
      if (!coinData) {
        throw new AppError(
          `coin ${coin} is not supported`,
          HttpStatus.BAD_REQUEST,
        );
      }
      this.addTrackedCoin(coin);
      const rate = coinData[currency];
      if (!rate) {
        throw new AppError(
          `Currency ${currency} is not supported`,
          HttpStatus.BAD_REQUEST,
        );
      }
      this.addTrackedCurrency(currency);
      this.logger.log(`Got rate for ${coin} in ${currency} via api: ${rate}`);
      this.cachedCoinRates[coin] = {
        ...this.cachedCoinRates[coin],
        [currency]: rate,
      };
      return rate;
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === HttpStatus.TOO_MANY_REQUESTS
      ) {
        this.logger.warn(
          `Rate limit hit for CoinGecko, retrying in 10 seconds...`,
        );
        await new Promise((res) => setTimeout(res, 10_000));
        return this.getCoinRate(coin, currency);
      }
      this.logger.error(
        `Error fetching price for ${coin}: ${error instanceof AxiosError && error.message}`,
      );
      this.errorHandler.handleError(error);
    }
  }

  //get rates for array of crypto coins with 1 currency with 1 api call to coin gecho
  //this method first checks cache for rates and for rates that was not found, fetches rates from api and updates cache
  //for coins that are in cache it returns the rate from cache
  async getMultipleRates(
    coins: string[],
    currency: string = this.DEFAULT_CURRENCY,
  ): Promise<CoinRate> {
    const rates: CoinRate = {};
    const coinsToFetch: string[] = [];
    coins.forEach((coin) => {
      //check cache for rate
      const rate = this.getRateFromCache(coin, currency);
      //if rate is found in cache, add it to rates
      if (rate != 0) {
        rates[coin] = rate;
      } else {
        //if rate is not found in cache, add coin to coinsToFetch
        coinsToFetch.push(coin);
      }
    });
    //if there are coins to fetch
    if (coinsToFetch.length > 0) {
      try {
        //fetch rates from api
        const response = await axios.get<ExchangeRates>(this.GET_RATES_URL, {
          params: {
            ids: coinsToFetch.join(','),
            vs_currencies: currency,
          },
        });
        if (Object.keys(response.data).length === 0) {
          throw new AppError(
            `one or more coins are not supported (${coinsToFetch.join(', ')})`,
            HttpStatus.BAD_REQUEST,
          );
        }
        Object.keys(response.data).forEach((coin) => {
          const coinData = response.data[coin];
          if (!coinData) {
            throw new AppError(
              `coin ${coin} is not supported`,
              HttpStatus.BAD_REQUEST,
            );
          }
          this.addTrackedCoin(coin);
          const rate = coinData[currency];
          if (!rate) {
            throw new AppError(
              `Currency ${currency} is not supported`,
              HttpStatus.BAD_REQUEST,
            );
          }
          rates[coin] = rate;
        });
        this.addTrackedCurrency(currency);
        //update cache
        this.cacheRates(response.data as Record<string, CoinRate>);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === HttpStatus.TOO_MANY_REQUESTS
        ) {
          this.logger.warn(
            `Rate limit hit for CoinGecko, retrying in 10 seconds...`,
          );
          await new Promise((res) => setTimeout(res, 10_000));
          return this.getMultipleRates(coins, currency);
        }
        this.logger.error(
          `Error fetching prices for ${coinsToFetch.join(', ')}: + 
          ${error instanceof Error ? error.message : String(error)}`,
        );
        this.errorHandler.handleError(error);
      }
    }
    return rates;
  }
}
