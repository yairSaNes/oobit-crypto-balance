import { Injectable } from '@nestjs/common';
import { FileService } from '@shared/file.service';

@Injectable()
export class BalanceServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
