import { Module } from '@nestjs/common';
import { BalanceServiceController } from './balance-service.controller';
import { BalanceServiceService } from './balance-service.service';
import { FileService } from '@shared/file.service';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [FileService],
  controllers: [BalanceServiceController],
  providers: [BalanceServiceService],
})
export class BalanceServiceModule {}
