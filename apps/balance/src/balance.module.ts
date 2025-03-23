import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { FileService } from '@shared/file.service';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [FileService],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceServiceModule {}
