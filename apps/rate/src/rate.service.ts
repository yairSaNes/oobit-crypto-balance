import { Injectable } from '@nestjs/common';

@Injectable()
export class RateService {
  getHello(): string {
    return 'Hello World!';
  }
}
