import { Injectable } from '@nestjs/common';
import { FileService } from '@shared/file.service';
import { CryptoBalance } from '@shared/interfaces';

@Injectable()
export class BalanceService {
  private readonly filePath = 'data/balance.json';

  constructor(private readonly fileService: FileService){}

  async getBalances(): Promise<CryptoBalance[]>{
    return this.fileService.readJsonFile<CryptoBalance[]>(this.filePath);
  }

  async addBalance(balance: CryptoBalance): Promise<void> {
    const balances = await this.getBalances();
    balances.push(balance);
    await this.fileService.writeJsonFile(this.filePath, balances);
  }
}
