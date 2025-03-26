import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  HttpStatus,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { BalanceService } from './balance.service';
import { CryptoBalance } from '@shared/interfaces';
import { AppError } from '@shared/AppError';
import { LoggingService } from '@shared/logging.service';

@Controller('balances')
export class BalanceController {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext(BalanceController.name);
  }

  @Get()
  async getAllUserBalances(): Promise<CryptoBalance[]> {
    return this.balanceService.getAllBalances();
  }

  @Get('user')
  async getUserBalance(
    @Headers('x-user-id') userId: string,
  ): Promise<CryptoBalance> {
    if (!userId) {
      throw new AppError(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const balance = await this.balanceService.getUserBalance(userId);
    if (!balance) {
      throw new AppError(`User ${userId} not found`, HttpStatus.NOT_FOUND);
    }
    return balance;
  }

  @Get('user/value')
  async getUserBalanceValue(
    @Headers('x-user-id') userId: string,
    @Query('currency') currency = 'usd',
  ): Promise<{ value: number; currency: string }> {
    if (!userId) {
      throw new AppError(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const value = await this.balanceService.getUserBalanceValue(
      userId,
      currency,
    );
    if (!value) {
      throw new AppError(`User ${userId} not found`, HttpStatus.NOT_FOUND);
    }
    return { value: value, currency };
  }

  @Put('user/rebalance')
  async rebalanceUser(
    @Headers('x-user-id') userId: string,
    @Body() targetPercentages: Record<string, number>,
    // ): Promise<void> {
  ): Promise<CryptoBalance> {
    if (!userId) {
      throw new AppError(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!targetPercentages || Object.keys(targetPercentages).length === 0) {
      throw new AppError(
        'Balance data cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.balanceService.rebalanceUser(userId, targetPercentages);
  }

  @Post('user/add')
  async createUser(
    @Headers('x-user-id') userId: string,
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new AppError(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    this.logger.log(`user id: ${userId}`);
    await this.balanceService.createUser(userId);
    return { message: `user ${userId} created succefully` };
  }

  @Put('user/update')
  async updateBalance(
    @Headers('x-user-id') userId: string,
    @Body() body: { coin: string; amount: number },
  ): Promise<CryptoBalance> {
    if (!userId) {
      throw new AppError(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!body.coin || !body.amount) {
      throw new AppError(
        'Coin and amount must be provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (body.amount === 0) {
      throw new AppError(
        `amount can't be changed by 0`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.balanceService.updateBalance(userId, body.coin, body.amount);
  }

  @Delete('user/remove')
  async removeUser(
    @Headers('x-user-id') userId: string,
  ): Promise<CryptoBalance> {
    if (!userId) {
      throw new AppError(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    this.logger.log(`user id: ${userId}`);
    return this.balanceService.removeUser(userId);
  }
}
