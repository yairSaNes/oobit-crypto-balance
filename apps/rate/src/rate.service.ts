import { Injectable } from '@nestjs/common';
import { FileService } from '@shared/file.service';
import { CryptoRate } from '@shared/interfaces';
import axios from 'axios';
import { response } from 'express';

@Injectable()
export class RateService {
  private readonly filePath = 'data/rates.json';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

  constructor(private readonly fileService: FileService){}

  async getRates(): Promise<CryptoRate[]>{
    return this.fileService.readJsonFile<CryptoRate[]>(this.filePath);
  }

  async updateRate(rate: CryptoRate): Promise<void>{
    const rates = await this.getRates();
    const index = rates.findIndex(r => r.coin === rate.coin);
    if(index !== -1){
      rates[index] = rate;
    }else{
      rates.push(rate);
    }
    await this.fileService.writeJsonFile(this.filePath, rates);
  }

  async getCryptoPrice(coin: string, currency: string = 'usd'): Promise<number>{
    try{
      const response = await axios.get(this.COINGECKO_API,{
        params: {
          ids: coin,
          vs_currencies: currency,
        },
      });
      return response.data[coin]?.[currency] ?? 0;
    }catch(err){
      console.error(`Error fetching price for ${coin}:`, err);
      throw new Error('Failed to fetch cryptocurrency price.');
    }
  }
}
