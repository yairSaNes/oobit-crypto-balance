import { Injectable } from '@nestjs/common';
import { FileService } from '@shared/file.service';
import { CryptoRate } from '@shared/interfaces';

@Injectable()
export class RateService {
  private readonly filePath = 'data/rates.json';

  constructor(private readonly fileService: FileService){}

  async getRates(): Promise<CryptoRate[]>{
    return this.fileService.readJsonFile<CryptoRate[]>(this.filePath);
  }

  async updateRate(rate: CryptoRate): Promise<void>{
    const rates = await this.getRates();
    const index = rates.findIndex(r => r.asset === rate.asset);
    if(index !== -1){
      rates[index] = rate;
    }else{
      rates.push(rate);
    }
    await this.fileService.writeJsonFile(this.filePath, rates);
  }
}
