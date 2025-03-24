import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppError } from '@shared/error-handling';
import { FileService } from '@shared/file.service';
import { CryptoRate } from '@shared/interfaces';
import axios from 'axios';

interface CoinRate {
  [key: string]: number;  // Key: currency, Value: rate
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
  private readonly COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

  private supportedCoins: string[] = [];
  private supportedCurrencies: string[] = [];
  private coinRates: Record<string, CoinRate> = {};  

  constructor(private readonly fileService: FileService){}

  async onModuleInit(): Promise<void> {
    this.logger.log('Restoring supported coins and currencies from disk...');
    await this.restoreSupportedData();
  }

  getSupportedCoins(): string[] {
    return this.supportedCoins;
  }

  getSupportedCurrencies(): string[] {
    return this.supportedCurrencies;
  }

  setSupportedCoins(supportedCoins: string[]): void {
    this.supportedCoins = supportedCoins;
    this.logger.log(`updated supported coins with ${supportedCoins.length} coins`);
  }

  setSupportedCurrencies(supportedCurrencies: string[]): void {
    this.supportedCurrencies = supportedCurrencies;
    this.logger.log(`updated supported currencies with ${supportedCurrencies.length} currencies`);
  }

  addCoin(coin: string): void {
    if (!this.supportedCoins.includes(coin)) {
      this.supportedCoins.push(coin);
    }
  }

  addCurrency(currency: string): void {
    if (!this.supportedCurrencies.includes(currency)) {
      this.supportedCurrencies.push(currency);
    }
  }

  getCoinRates(coin: string): CoinRate | undefined {
    return this.coinRates[coin];
  }

  async fetchRates(): Promise<void>{
    if (this.supportedCoins.length === 0 || this.supportedCurrencies.length === 0) {
      this.logger.warn('No supported coins or currencies to fetch rates for.');
      return;
    }
    const coins = this.supportedCoins.join(',');
    const currencies = this.supportedCurrencies.join(',');
    try{
      const response = await axios.get(this.COINGECKO_API_URL, {
        params: {
          ids: coins,
          vs_currencies: currencies,
        },
      });
      this.cacheRates(response.data);
      this.logger.log(`Fetched rates for ${Object.keys(response.data).length} coins.`);
    }
    catch (error) {
      if (error.response?.status === 429) {
        this.logger.warn(`Rate limit hit for CoinGecko, retrying in 10 seconds...`);
        await new Promise((res) => setTimeout(res, 10_000));
        return await this.fetchRates();
      }
      this.logger.error('Error fetching rates from CoinGecko', error);
      throw new AppError('Failed to fetch rates from CoinGecko');
    }
  }

  private cacheRates(rates: any): void {
    Object.keys(rates).forEach(coin => {
      this.coinRates[coin] = { ...this.coinRates[coin], ...rates[coin] };
    });
  }
  
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.log('Fetching latest crypto rates...');
    await this.fetchRates();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async saveSuportedDataToDisk(): Promise<void>{
    const data = {
      timeStamp: Date.now(),
      supportedCoins: this.supportedCoins,
      supportedCurrencies: this.supportedCurrencies,
    };
    await this.fileService.writeJsonFile(this.filePath, data);
    this.logger.log('Saved supported coins and currencies to disk');
  }

  async restoreSupportedData(): Promise<void> {
    try{
      const data = await this.fileService.readJsonFile<SupportedData>(this.filePath);
      if (!data?.supportedCoins || !data?.supportedCurrencies) {
        this.logger.warn('No valid supported coins or currencies found in stored data.');
        return;
      }
      this.supportedCoins = data.supportedCoins;
      this.supportedCurrencies = data.supportedCurrencies;
      const restoredAt = new Date(data.timeStamp).toISOString();
      this.logger.log(`Supported coins and currencies restored from disk (Last saved: ${restoredAt})`);
    }
    catch(error){
      this.logger.error('Failed to restore supported coins and currencies from disk', error);
    }
  }

  async getCryptoPrice(coin: string, currency: string = 'usd', skipCache: boolean = false): Promise<number>{
    if(!skipCache){
      //search cache for rate: 
      const cachedRate = this.coinRates[coin]?.[currency];
      if (cachedRate){
        this.logger.log(`Rate for ${coin} in ${currency} found in cache: ${cachedRate}`);
        return cachedRate;
      } 
    }

    try{
      const response = await axios.get(this.COINGECKO_API_URL,{
        params: {
          ids: coin,
          vs_currencies: currency,
        },
      });
      const rate = response.data[coin]?.[currency] ?? 0;
      if (rate){
        this.logger.log(`Got rate for ${coin} in ${currency} via api: ${rate}`);
        this.coinRates[coin] = { ...this.coinRates[coin], [currency]: rate };
      } 
      return rate; 
    }catch(error){
      if (error.response?.status === 429) {
        this.logger.warn(`Rate limit hit for CoinGecko, retrying in 10 seconds...`);
        await new Promise((res) => setTimeout(res, 10_000));
        return this.getCryptoPrice(coin, currency, skipCache);
      }
      this.logger.error(`Error fetching price for ${coin}: ${error.message}`);
      throw new AppError('Failed to fetch cryptocurrency price.');
    }
  }
}
