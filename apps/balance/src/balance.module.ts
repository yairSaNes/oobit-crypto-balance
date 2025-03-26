import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { SharedModule } from '@shared/shared.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [SharedModule, ScheduleModule.forRoot()],
  controllers: [BalanceController],
  providers: [BalanceService, SharedModule],
})
export class BalanceServiceModule {}
