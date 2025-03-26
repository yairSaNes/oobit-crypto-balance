import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppError } from '@shared/error-handling';
import { FileService } from '@shared/file.service';
import { CoinRate, CryptoBalance } from '@shared/interfaces';
import axios, { AxiosError } from 'axios';

@Injectable()
export class BalanceService {
  private readonly filePath = 'data/balance.json';
  private readonly RATE_SERVICE_URL = 'http://localhost:3002';

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
    } else {
      throw new BadRequestException(`User ${userId} already exist`);
    }
  }

  async getUserBalanceValue(
    userId: string,
    currency: string = 'usd',
  ): Promise<number> {
    const userBalance = await this.getUserBalance(userId);
    if (!userBalance) {
      throw new BadRequestException(`User ${userId} does not exist`);
    }
    const coins = userBalance.wallet.map((entry) => entry.coin);
    try {
      const response = await axios.get<{ CoinRates: CoinRate }>(
        this.RATE_SERVICE_URL + '/rates',
        {
          params: {
            coins: coins.join(','),
            currency: currency,
          },
        },
      );

      const rates = response.data.CoinRates;
      if (!rates) {
        throw new AppError('Invalid response from rate service');
      }

      const totalValue = userBalance.wallet.reduce((total, entry) => {
        const rate = rates[entry.coin] ?? 0; // Default to 0 if rate is missing
        return total + entry.amount * rate;
      }, 0);
      return totalValue;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          'Error fetching crypto rates:',
          error.response?.data || error.message,
        );
      } else {
        console.error('Unknown error:', error);
      }
      throw new AppError('Failed to fetch cryptocurrency prices.');
    }
  }

  async removeUser(userId: string): Promise<CryptoBalance> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    const userBalance = allBalances.find((b) => b.userId === userId);
    if (!userBalance) {
      throw new BadRequestException(`User ${userId} does not exist`);
    }
    const updatedBalances = allBalances.filter((b) => b.userId !== userId);
    await this.fileService.writeJsonFile(this.filePath, updatedBalances);
    return userBalance;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateTrackedCoins() {
    try {
      const supportedCoins: string[] = await this.getAllTrackedCoins();
      const response = await axios.post(
        this.RATE_SERVICE_URL + '/coins',
        supportedCoins,
      );
      console.log(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Error:', error.response?.data || error.message);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }

  async getAllTrackedCoins(): Promise<string[]> {
    const allBalances: CryptoBalance[] = await this.fileService.readJsonFile<
      CryptoBalance[]
    >(this.filePath);

    const coinsSet = new Set<string>();
    allBalances.forEach((user) => {
      user.wallet.forEach((entry) => coinsSet.add(entry.coin.toLowerCase())); // Ensuring uniqueness in a case-insensitive manner
    });

    return Array.from(coinsSet);
  }

  async rebalanceUser(
    userId: string,
    targetPercentages: Record<string, number>,
  ): Promise<CryptoBalance> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    const userBalance = allBalances.find((b) => b.userId === userId);
    if (!userBalance) {
      throw new AppError(`User ${userId} not found.`);
    }
    const percentageSum = Object.values(targetPercentages).reduce(
      (sum, percentage) => sum + percentage,
      0,
    );
    if (percentageSum !== 100) {
      throw new AppError('Target percentages must sum up to 100');
    }

    const totalValue = await this.getUserBalanceValue(userId);
    const newWallet = await Promise.all(
      Object.keys(targetPercentages).map(async (coin) => {
        const targetPercentage = targetPercentages[coin] ?? 0;
        const targetValue = (targetPercentage / 100) * totalValue;
        // Fetch the current rate of the coin - should be cached
        const response = await axios.get<number>(
          this.RATE_SERVICE_URL + '/rates/rate',
          {
            params: {
              coin: coin,
            },
          },
        );
        const rate: number = response.data;
        const newAmount = targetValue / rate;
        return { coin: coin, amount: newAmount };
      }),
    );

    userBalance.wallet = newWallet;
    const updatedBalances = allBalances.filter((b) => b.userId !== userId);
    updatedBalances.push(userBalance);
    await this.fileService.writeJsonFile(this.filePath, updatedBalances);
    return userBalance;
  }
}
