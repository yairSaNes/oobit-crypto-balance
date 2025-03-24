import { Module } from '@nestjs/common';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { SharedModule } from '@shared/shared.module';
import { FileService } from '@shared/file.service';

@Module({
  imports: [SharedModule],
  controllers: [BalanceController],
  providers: [BalanceService, FileService],
})
export class BalanceServiceModule {}
