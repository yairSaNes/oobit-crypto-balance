import { HttpStatus, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppError } from '@shared/AppError';
import { ErrorHandlingService } from '@shared/error-handling.service';
import { FileService } from '@shared/file.service';
import { CoinRate, CryptoBalance } from '@shared/interfaces';
import { LoggingService } from '@shared/logging.service';
import axios from 'axios';
import * as path from 'path';

@Injectable()
export class BalanceService {
  // private readonly filePath = 'data/balance.json';
  private readonly filePath = path.join(__dirname, '../../data/balances.json');
  private readonly RATE_SERVICE_URL = `${process.env.RATE_SERVICE_URL || 'http://localhost:3002'}/rates`;

  constructor(
    private readonly fileService: FileService,
    private readonly logger: LoggingService,
    private readonly errorHandler: ErrorHandlingService,
  ) {
    this.logger.setContext(BalanceService.name);
  }

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
      throw new AppError(`User ${userId} not found.`, HttpStatus.NOT_FOUND);
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
        throw new AppError(
          `${coin} amount in wallet is insufficient (${lastAmount}).`,
          HttpStatus.BAD_REQUEST,
        );
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
      } else {
        throw new AppError(
          `Coin ${coin} not found in wallet.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    // Save the updated balance data
    await this.fileService.writeJsonFile(this.filePath, allBalances);
    // Return the updated user balance
    return userBalance;
  }

  async transferCoin(
    sourceUserId: string,
    targetUserId: string,
    coin: string,
    amount: number,
  ): Promise<CryptoBalance> {
    //validating target user exist
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    const targetUserBalance = allBalances.find(
      (balance) => balance.userId === targetUserId,
    );
    if (!targetUserBalance) {
      throw new AppError(
        `Target user ${targetUserId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    // Perform the transfer by updating both users' balances
    // Deduct from source user
    // this also validates source user exists and has sufficient amount
    this.logger.log(
      `Transferring ${amount} ${coin} from ${sourceUserId} to ${targetUserId}...`,
    );
    const updatedBalance: CryptoBalance = await this.updateBalance(
      sourceUserId,
      coin,
      -amount,
    );
    await this.updateBalance(targetUserId, coin, amount); // Add to target user
    this.logger.log(`Transfer complete.}`);

    // Return the updated balance for the source user
    return updatedBalance;
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
      throw new AppError(`User ${userId} already exist`, HttpStatus.CONFLICT);
    }
  }

  async getUserBalanceValue(
    userId: string,
    currency: string = 'usd',
  ): Promise<number> {
    try {
      const userBalance = await this.getUserBalance(userId);
      if (!userBalance) {
        throw new AppError(
          `User ${userId} does not exist`,
          HttpStatus.NOT_FOUND,
        );
      }

      const coins = userBalance.wallet.map((entry) => entry.coin);
      const response = await axios.get<{ CoinRates: CoinRate }>(
        this.RATE_SERVICE_URL,
        { params: { coins: coins.join(','), currency } },
      );

      const rates = response.data.CoinRates;
      if (!rates) {
        throw new AppError(
          'Invalid response from rate service',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const totalValue = userBalance.wallet.reduce((total, entry) => {
        const rate = rates[entry.coin] ?? 0;
        return total + entry.amount * rate;
      }, 0);
      return totalValue;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          'Error fetching crypto rates:' +
            JSON.stringify(error.response?.data) || String(error.message),
        );
      } else {
        this.logger.error('Unknown error:' + String(error));
      }
      this.errorHandler.handleError(error);
    }
  }

  async removeUser(userId: string): Promise<CryptoBalance> {
    const allBalances: CryptoBalance[] = await this.getAllBalances();
    const userBalance = allBalances.find((b) => b.userId === userId);
    if (!userBalance) {
      throw new AppError(`User ${userId} does not exist`, HttpStatus.NOT_FOUND);
    }
    const updatedBalances = allBalances.filter((b) => b.userId !== userId);
    await this.fileService.writeJsonFile(this.filePath, updatedBalances);
    return userBalance;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateTrackedCoins() {
    try {
      const trackedCoins: string[] = await this.getAllTrackedCoins();
      const response = await axios.post(
        this.RATE_SERVICE_URL + '/coins',
        trackedCoins,
      );
      this.logger.log(
        `Updated tracked coins: ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          'Error fetching tracked coins:' +
            JSON.stringify(error.response?.data) || error.message,
        );
      } else {
        this.logger.error(
          'Unexpected error: ' +
            (error instanceof Error ? error.message : String(error)),
        );
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
      throw new AppError(`User ${userId} not found.`, HttpStatus.NOT_FOUND);
    }
    if (userBalance.wallet.length === 0) {
      throw new AppError(
        `User ${userId} has no balance.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const percentageSum = Object.values(targetPercentages).reduce(
      (sum, percentage) => sum + percentage,
      0,
    );
    if (percentageSum !== 100) {
      throw new AppError(
        'Target percentages must sum up to 100%',
        HttpStatus.BAD_REQUEST,
      );
    }

    const totalValue = await this.getUserBalanceValue(userId);
    const newWallet = await Promise.all(
      Object.keys(targetPercentages).map(async (coin) => {
        const targetPercentage = targetPercentages[coin] ?? 0;
        const targetValue = (targetPercentage / 100) * totalValue;
        // Fetch the current rate of the coin - should be cached
        const response = await axios.get<number>(
          this.RATE_SERVICE_URL + '/rate',
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
