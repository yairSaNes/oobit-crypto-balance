import { BadRequestException, Injectable } from '@nestjs/common';
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

  //get balance by user ID
  async getUserBalance(userId: string): Promise<CryptoBalance | undefined> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    return allBalances.find((balance) => balance.userId === userId);
  }

  //update balance by amount, amount can also ne negative
  async updateBalance(
    userId: string,
    coin: string,
    amount: number,
  ): Promise<CryptoBalance> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    //find user balance
    const userBalance = allBalances.find(
      (balance) => balance.userId === userId,
    );
    if (!userBalance) {
      throw new AppError(`User ${userId} not found.`);
    }

    // Check if the user already holds the coin
    const existingCoinIndex: number = userBalance.wallet.findIndex(
      (b) => b.coin === coin,
    );
    if (existingCoinIndex >= 0) {
      // If the coin exists, update the amount
      const lastAmount = userBalance.wallet[existingCoinIndex].amount;
      const newAmount = lastAmount + amount;
      if (newAmount < 0) {
        throw new AppError(`Amount in wallet is insufficient (${lastAmount}).`);
      }
      if (newAmount === 0) {
        userBalance.wallet.splice(existingCoinIndex, 1);
      } else {
        userBalance.wallet[existingCoinIndex].amount = newAmount;
      }
    } else {
      // if coin doesn't exist, add it to the user's wallet
      if (amount > 0) {
        userBalance.wallet.push({ coin, amount });
      }
    }
    // Save the updated balance data
    await this.fileService.writeJsonFile(this.filePath, allBalances);
    // Return the updated user balance
    return userBalance;
  }

  async createUser(userId: string): Promise<void> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    const userBalance = allBalances.find(
      (balance) => balance.userId === userId,
    );
    if (!userBalance) {
      allBalances.push({ userId, wallet: [] });
      await this.fileService.writeJsonFile(this.filePath, allBalances);
    }
  }

  async removeUser(userId: string): Promise<CryptoBalance> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    const userIndex: number = allBalances.findIndex((b) => b.userId === userId);
    const userBalance: CryptoBalance = allBalances[userIndex];
    if (userIndex >= 0) {
      allBalances.splice(userIndex, 1);
      await this.fileService.writeJsonFile(this.filePath, allBalances);
      return userBalance;
    }
    throw new BadRequestException(`User ${userId} Does not exist`);
  }
}
