import { Controller, Get, Post, Body } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { CryptoBalance } from '@shared/interfaces';

@Controller('balances')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  async getAllBalances(): Promise<CryptoBalance[]>{
    return this.balanceService.getBalances();
  }

  @Post()
  async addBalance(@Body() balance: CryptoBalance): Promise<void>{
    await this.balanceService.addBalance(balance);
  }
}
