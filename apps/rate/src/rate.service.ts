/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppError } from '@shared/error-handling';
import { FileService } from '@shared/file.service';
import axios, { AxiosError } from 'axios';

interface CoinRate {
  [key: string]: number; // Key: currency, Value: rate
}

interface SupportedData {
  timeStamp: number;
  supportedCoins: string[];
  supportedCurrencies: string[];
}

@Injectable()
export class RateService {
  private readonly logger = new Logger(RateService.name);
  private readonly filePath = 'data/rates.json';
  private readonly COINGECKO_API_URL =
    'https://api.coingecko.com/api/v3/simple/price';

  private supportedCoins: string[] = [];
  private supportedCurrencies: string[] = [];
  private cachedCoinRates: Record<string, CoinRate> = {};
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL_MS = 60 * 1000;

  constructor(private readonly fileService: FileService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Restoring supported coins and currencies from file...');
    await this.restoreSupportedData(); //restore data from file after crash
    await this.fetchRates(); //get rates from coin gecho api
  }

  getSupportedCoins(): string[] {
    return this.supportedCoins;
  }

  getSupportedCurrencies(): string[] {
    return this.supportedCurrencies;
  }

  //changes supportedCoins array
  setSupportedCoins(supportedCoins: string[]): void {
    this.supportedCoins = [...new Set(supportedCoins)];
    this.logger.log(
      `updated supported coins with ${supportedCoins.length} coins`,
    );
  }

  //changes supportedCurrencies array
  setSupportedCurrencies(supportedCurrencies: string[]): void {
    this.supportedCurrencies = [...new Set(supportedCurrencies)];
    this.logger.log(
      `updated supported currencies with ${supportedCurrencies.length} currencies`,
    );
  }

  //adds a coin to supportedCoins
  addCoin(coin: string): void {
    if (!this.supportedCoins.includes(coin)) {
      this.supportedCoins.push(coin);
    }
  }

  //adds a currency to supportedCurrencies
  addCurrency(currency: string): void {
    if (!this.supportedCurrencies.includes(currency)) {
      this.supportedCurrencies.push(currency);
    }
  }

  //gets rates for all supported coins and currencies and updates the cache
  async fetchRates(): Promise<void> {
    if (
      this.supportedCoins.length === 0 ||
      this.supportedCurrencies.length === 0
    ) {
      this.logger.warn('No supported coins or currencies to fetch rates for.');
      return;
    }
    try {
      const coins = this.supportedCoins.join(',');
      const currencies = this.supportedCurrencies.join(',');
      const response = await axios.get(this.COINGECKO_API_URL, {
        params: {
          ids: coins,
          vs_currencies: currencies,
        },
      });
      this.cacheRates(response.data as object); //updates cache
      this.logger.log(
        `Fetched rates for ${Object.keys(response.data as object).length} coins.`,
      );
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 429) {
        this.logger.warn(
          `Rate limit hit for CoinGecko, retrying in 10 seconds...`,
        );
        await new Promise((res) => setTimeout(res, 10_000));
        return await this.fetchRates();
      }
      this.logger.error('Error fetching rates from CoinGecko', error);
      throw new AppError('Failed to fetch rates from CoinGecko');
    }
  }

  private cacheRates(rates: object): void {
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

  //cron job to fetch rates
  @Cron(CronExpression.EVERY_30_SECONDS)
  async cronFetch() {
    this.logger.log('Fetching latest crypto rates...');
    await this.fetchRates();
  }

  //stores supportedCoins & supportedcurrencies to file for crash failsafe
  @Cron(CronExpression.EVERY_5_MINUTES)
  async saveSuportedDataToDisk(): Promise<void> {
    const data = {
      timeStamp: Date.now(),
      supportedCoins: this.supportedCoins,
      supportedCurrencies: this.supportedCurrencies,
    };
    await this.fileService.writeJsonFile(this.filePath, data);
    this.logger.log(
      `Saved ${this.supportedCoins.length} supported coins and ${this.supportedCurrencies.length} supported currencies to disk`,
    );
  }

  // restore supported data from file
  async restoreSupportedData(): Promise<void> {
    try {
      const data = await this.fileService.readJsonFile<SupportedData>(
        this.filePath,
      );
      if (!data?.supportedCoins || !data?.supportedCurrencies) {
        this.logger.warn(
          'No valid supported coins or currencies found in stored data.',
        );
        return;
      }
      this.supportedCoins = data.supportedCoins;
      this.supportedCurrencies = data.supportedCurrencies;
      const restoredAt = new Date(data.timeStamp).toISOString();
      this.logger.log(
        `Supported coins and currencies restored from file (Last saved: ${restoredAt})`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to restore supported coins and currencies from file',
        error,
      );
    }
  }

  //get price for 1 crypto coin with 1 currency
  async getCryptoPrice(
    coin: string,
    currency: string = 'usd',
    skipCache: boolean = false,
  ): Promise<number> {
    //if skipCache wasn't selected or cache isn't expired
    if (!skipCache && Date.now() < this.cacheExpiry) {
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
    this.addCoin(coin);
    this.addCurrency(currency);
    try {
      const response = await axios.get(this.COINGECKO_API_URL, {
        params: {
          ids: coin,
          vs_currencies: currency,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const rate: number = response.data[coin]?.[currency] ?? 0;
      if (rate) {
        this.logger.log(`Got rate for ${coin} in ${currency} via api: ${rate}`);
        this.cachedCoinRates[coin] = {
          ...this.cachedCoinRates[coin],
          [currency]: rate,
        };
      }
      return rate;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 429) {
        this.logger.warn(
          `Rate limit hit for CoinGecko, retrying in 10 seconds...`,
        );
        await new Promise((res) => setTimeout(res, 10_000));
        return this.getCryptoPrice(coin, currency, skipCache);
      }
      this.logger.error(
        `Error fetching price for ${coin}: ${error instanceof AxiosError && error.message}`,
      );
      throw new AppError('Failed to fetch cryptocurrency price.');
    }
  }
}
