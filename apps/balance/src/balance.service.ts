import { Injectable } from '@nestjs/common';
import { AppError } from '@shared/error-handling';
import { FileService } from '@shared/file.service';
import { CryptoBalance } from '@shared/interfaces';

@Injectable()
export class BalanceService {
  private readonly filePath = 'data/balance.json';

  constructor(private readonly fileService: FileService) {}

  async getAllBalances(): Promise<CryptoBalance[]> {
    return this.fileService.readJsonFile<CryptoBalance[]>(this.filePath);
  }

  async getUserBalance(userId: string): Promise<CryptoBalance | undefined> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    return allBalances.find(balance => balance.userId === userId);
  }

  async updateBalance(userId: string, coin: string, amount: number): Promise<CryptoBalance> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    let userBalance = allBalances.find(balance => balance.userId === userId);
    if (!userBalance) {
      throw new AppError(`User ${userId} not found.`);
    }

    // Check if the user holds the coin already
    const existingCoinIndex = userBalance.wallet.findIndex((b) => b.coin === coin);    
    if (existingCoinIndex >= 0) {
      // If the coin exists, update the amount
      userBalance.wallet[existingCoinIndex].amount += amount;
    } else {
      // Otherwise, add the new coin to the user's wallet
      userBalance.wallet.push({ coin, amount });
    }

    // Save the updated balance data
    await this.fileService.writeJsonFile(this.filePath, allBalances);

    // Return the updated user balance
    return userBalance;
  }

  async addUser(userId: string) {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    let userBalance = allBalances.find(balance => balance.userId === userId);
    if (!userBalance) {
      allBalances.push({ userId, wallet: [] });
      await this.fileService.writeJsonFile(this.filePath, allBalances);
    }
  }
}
