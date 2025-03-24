import { Controller, Get, Post, Body, Headers, HttpException, HttpStatus, Put } from '@nestjs/common';
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
  async getUserBalance(@Headers('x-user-id') userId: string): Promise<CryptoBalance> {
    if (!userId) {
      throw new HttpException('X-User-ID header is required', HttpStatus.BAD_REQUEST);
    }

    const balance = await this.balanceService.getUserBalance(userId);
    if (!balance) {
      throw new HttpException(`User ${userId} not found`, HttpStatus.NOT_FOUND);
    }
    return balance;
  }

  @Post('add')
  async addUser(@Headers('x-user-id') userId: string): Promise<void>{
    if (!userId) {
      throw new HttpException('X-User-ID header is required', HttpStatus.BAD_REQUEST);
    }
    console.log(`user id: ${userId}`);
    await this.balanceService.addUser(userId);
  }

  @Put('update')
  async updateBalance(
    @Headers('x-user-id') userId: string,
    @Body() body: { coin: string; amount: number }
  ): Promise<CryptoBalance> {
    if (!userId) {
      throw new HttpException('X-User-ID header is required', HttpStatus.BAD_REQUEST);
    }
    if (!body.coin) {
      throw new HttpException('Coin and amount must be provided', HttpStatus.BAD_REQUEST);
    }

    return this.balanceService.updateBalance(userId, body.coin, body.amount);
  }
}
