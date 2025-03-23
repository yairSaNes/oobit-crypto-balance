import { Injectable } from '@nestjs/common';
import { FileService } from '@shared/file.service';
import { CryptoBalance } from '@shared/interfaces';

@Injectable()
export class BalanceService {
  getHello(): string {
    return 'Hello World!';
  }
}
