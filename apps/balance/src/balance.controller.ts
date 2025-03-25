import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Put,
  BadRequestException,
  Delete,
  Query,
} from '@nestjs/common';
import { BalanceService } from './balance.service';
import { CryptoBalance } from '@shared/interfaces';

@Controller('balances')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  async getAllUserBalances(): Promise<CryptoBalance[]> {
    return this.balanceService.getAllBalances();
  }

  @Get('user')
  async getUserBalance(
    @Headers('x-user-id') userId: string,
  ): Promise<CryptoBalance> {
    if (!userId) {
      throw new HttpException(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const balance = await this.balanceService.getUserBalance(userId);
    if (!balance) {
      throw new HttpException(`User ${userId} not found`, HttpStatus.NOT_FOUND);
    }
    return balance;
  }

  @Get('user/value')
  async getUserBalanceValue(
    @Headers('x-user-id') userId: string,
    @Query('currency') currency = 'usd',
  ): Promise<{ value: number; currency: string }> {
    if (!userId) {
      throw new HttpException(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const value = await this.balanceService.getUserBalanceValue(
      userId,
      currency,
    );
    if (!value) {
      throw new HttpException(`User ${userId} not found`, HttpStatus.NOT_FOUND);
    }
    return { value: value, currency };
  }

  @Post('user/add')
  async createUser(
    @Headers('x-user-id') userId: string,
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new HttpException(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log(`user id: ${userId}`);
    await this.balanceService.createUser(userId);
    return { message: `user ${userId} created succefully` };
  }

  @Put('update')
  async updateBalance(
    @Headers('x-user-id') userId: string,
    @Body() body: { coin: string; amount: number },
  ): Promise<CryptoBalance> {
    if (!userId) {
      throw new HttpException(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!body.coin || !body.amount) {
      throw new HttpException(
        'Coin and amount must be provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (body.amount === 0) {
      throw new BadRequestException(`amount can't be changed by 0`);
    }
    return this.balanceService.updateBalance(userId, body.coin, body.amount);
  }

  @Delete('user/remove')
  async removeUser(
    @Headers('x-user-id') userId: string,
  ): Promise<CryptoBalance> {
    if (!userId) {
      throw new HttpException(
        'X-User-ID header is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    console.log(`user id: ${userId}`);
    return this.balanceService.removeUser(userId);
  }
}
